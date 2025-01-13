import * as restate from "@restatedev/restate-sdk"
import * as slack from "./util/slackutils"
import { KnownBlock, WebClient } from "@slack/web-api";
import type { ChatResponse, ChatSession } from "./chat";

// ----------------------------------------------------------------------------
//  The slack bot adapter
//
//  This is a proxy between slack webhooks/APIs and the chat bot, dealing
//  with all slack specific things, like deduplication, errors, formatting,
//  message updates, showing the bot's busy status, etc.
// ----------------------------------------------------------------------------

const SLACK_BOT_USER_ID = process.env["SLACK_BOT_USER_ID"]!;
const SLACK_BOT_TOKEN = process.env["SLACK_BOT_TOKEN"]!;
const SLACK_SIGNING_SECRET = process.env["SLACK_SIGNING_SECRET"]!;

if (!(SLACK_BOT_USER_ID && SLACK_BOT_TOKEN && SLACK_SIGNING_SECRET)) {
    console.error("Missing some SlackBot env variables (SLACK_BOT_USER_ID, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET)");
    process.exit(1);
}

const slackClient = new WebClient(SLACK_BOT_TOKEN);

/*
 * The service that gets the webhooks from slack for each event in the channels
 * where the bot is a member.
 */
const slackBotService = restate.service({
    name: "slackbot",
    handlers: {

        /*
         * This is the handler hit by the webhook. We do minimal stuff here to
         * ack the webhook asap (since it is guaranteed to be durable in Restate).
         */
        message: async (ctx: restate.Context, msg: slack.SlackMessage): Promise<any> => {     
            // verify first that event legit
            slack.verifySignature(ctx.request().body, ctx.request().headers, SLACK_SIGNING_SECRET);

            // handle challenges - this is part of Slacks endpoint verification
            if (msg.type === "url_verification") {
                return { challenge: msg.challenge };
            }

            // filter stuff like updates and echos from ourselves
            if (slack.filterIrrelevantMessages(msg, SLACK_BOT_USER_ID)) {
                return {}
            }

            // run actual message processing asynchronously
            ctx.serviceSendClient(slackBotService).process(msg);

            return {};
        },

        /*
         * This does the actual message processing, including de-duplication, interacting
         * with status updates, and interacting with the chat bot.
         */
        process: async (ctx: restate.Context, msg: slack.SlackMessage) => {
            const { channel, text } = msg.event;

            // dedupe events
            const newMessage = await ctx.objectClient(eventDeduperSvc, channel)
                                        .isNewMessage(msg.event_id)
            if (!newMessage) {
                return;
            }

            // send a 'typing...' message
            const procMsgTs = await ctx.run("post 'processing' status",
                () => sendProcessingMessage(channel, text));
            
            // talk to the actual chat bot - a virtual object per channel
            let response: ChatResponse;
            try {
                response = await ctx
                    .objectClient<ChatSession>({ name: "chatSession" }, channel)
                    .chatMessage(text);
            }
            catch (err: any) {
                await ctx.run("post error reply", () =>
                    sendErrorMessage(channel, `Failed to process: ${text}`, err?.message, procMsgTs));
                return;
            }

            // the reply replaces the 'typing...' message
            await ctx.run("post reply", () =>
                sendResultMessage(channel, response.message, response.quote, procMsgTs));
        }
    }
});

/*
 * A deduplication helper. A virtual object (one per chat channel) that remembers
 * The IDs of seen messages in state for 24 hours.
 */
const eventDeduperSvc = restate.object({
    name: "slackbotMessageDedupe",
    handlers: {
        isNewMessage: async (ctx: restate.ObjectContext, eventId: string) => {
            const known = await ctx.get<boolean>(eventId);

            if (!known) {
                ctx.set(eventId, true);
                ctx.objectSendClient(eventDeduperSvc, ctx.key, { delay: hours(24) })
                   .expireMessageId(eventId);
            }

            return ! Boolean(known);
        },
        expireMessageId: async (ctx: restate.ObjectContext, eventId: string) => {
            ctx.clear(eventId);
        }
    }
});

export const services: restate.ServiceBundle = {
    registerServices(endpoint: restate.RestateEndpoint) {
        endpoint.bind(slackBotService);
        endpoint.bind(eventDeduperSvc);
    }
}

// ----------------------------------------------------------------------------
//                            Slack API Helpers
// ----------------------------------------------------------------------------

async function sendResultMessage(
        channel: string,
        text: string,
        quote: string | undefined,
        msgTs: string) {

    const blocks: KnownBlock[] = [ {
        type: "section",
        text: {
            type: "plain_text",
            text
        }
    } ];

    if (quote) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: makeMarkdownQuote(quote)
            }
        });
    }

    await updateMessageInSlack(channel, text, blocks, msgTs);
}

async function sendErrorMessage(
        channel: string,
        errorMessage: string,
        quote: string | undefined,
        replaceMsgTs: string | undefined) {

    const blocks: KnownBlock[] = [
        { type: "divider" },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:exclamation: :exclamation: ${errorMessage}`
            }
        }
    ];

    if (quote) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: makeMarkdownQuote(quote)
            }
        });
    }

    blocks.push({ type: "divider" });

    await updateMessageInSlack(channel, errorMessage, blocks, replaceMsgTs);
}

export async function notificationHandler(_ctx: restate.Context, channel: string, message: string) {
    const blocks: KnownBlock[] = [
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:speech_balloon: ${message}`
            }
        },
        {
            type: "divider"
        }
    ]

    await postToSlack(channel, message, blocks);
}

async function sendProcessingMessage(channel: string, text: string): Promise<string> {
    const blocks: KnownBlock[] = [ {
        type: "section",
        text: {
            type: "mrkdwn",
            text: ":typing:"
        }
    } ]

    return postToSlack(channel, text, blocks);
}

async function postToSlack(channel: string, text: string, blocks: KnownBlock[]): Promise<string> {
    const slackResponse = await slackClient.chat.postMessage({ channel, text, blocks });
    if (!slackResponse.ok || slackResponse.error) {
        throw new Error("Failed to send message to Slack: " + slackResponse.error)
    }

    if (!slackResponse.ts) {
        throw new restate.TerminalError("Missing message timestamp in response");
    }

    return slackResponse.ts;
}

async function updateMessageInSlack(
        channel: string,
        text: string,
        blocks: KnownBlock[],
        replaceMsgTs?: string): Promise<void> {
    if (replaceMsgTs) {
        await slackClient.chat.update({ channel, text, blocks, ts: replaceMsgTs });
    } else {
        await slackClient.chat.postMessage({ channel, text, blocks });
    }
}

function makeMarkdownQuote(text: string): string {
    const lines: string[] = text.split("\n");
    return ":memo: " + lines.join(" \n> ");
}

function hours(hours: number): number {
    return hours * 60 * 60 * 1000;
}
