import { checkRethrowTerminalError, httpResponseToError } from "./utils";

// ----------------------------------------------------------------------------
//  Utilities and helpers to interact with OpenAI GPT APIs.
// ----------------------------------------------------------------------------

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];
if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    process.exit(1);
}

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";
const TEMPERATURE = 0.2; // use more stable (less random / cerative) responses

export type Role = "user" | "assistant" | "system";
export type ChatEntry = { role: Role , content: string };
export type GptResponse = { response: string, tokens: number };

export async function chat(prompt: {
    botSetupPrompt: string,
    chatHistory?: ChatEntry[] | null,
    userPrompts: string[]
}): Promise<GptResponse> {

    const setupPrompt: ChatEntry[] = [{ role: "system", content: prompt.botSetupPrompt }];
    const userPrompts: ChatEntry[] = prompt.userPrompts.map((userPrompt) => { return { role: "user", content: userPrompt } });
    const fullPrompt: ChatEntry[] = setupPrompt.concat(prompt.chatHistory ?? [], userPrompts);

    const response = await callGPT(fullPrompt);

    return {
        response: response.message.content,
        tokens: response.total_tokens
    }
}

async function callGPT(messages: ChatEntry[]) {
    try {
        const body = JSON.stringify({
            model: MODEL,
            temperature: TEMPERATURE,
            messages
        });

        const response = await fetch(OPENAI_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body
        });

        if (!response.ok) {
            httpResponseToError(response.status, await response.text());
        }

        const data: any = await response.json();
        const message = data.choices[0].message as ChatEntry;
        const total_tokens = data.usage.total_tokens as number;
        return { message, total_tokens };
    }
    catch (error) {
        console.error(`Error calling model ${MODEL} at ${OPENAI_ENDPOINT}: ${error}`);
        checkRethrowTerminalError(error);
    }
};

export function concatHistory(
        history: ChatEntry[] | null,
        entries: { user: string, bot?: string }): ChatEntry[] {

    const chatHistory = history ?? [];
    const newEntries: ChatEntry[] = []
    
    newEntries.push({ role: "user", content: entries.user });
    if (entries.bot) {
        newEntries.push({ role: "assistant", content: entries.bot });
    }
    return chatHistory.concat(newEntries);
}
