
# The Chatbot

This example is a chatbot for slack that interfaces with am LLM (GPT-4o) and maintains various tasks,
like reminders or watching flight prices. The video below (click the image) has a nice intro to the functionality and architecture.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=qsmoHmNUXNg" target="_blank">
 <img src="http://img.youtube.com/vi/qsmoHmNUXNg/mqdefault.jpg" alt="Watch the video" width="240" height="180" border="10" />
</a>

## Browsing the example

The core chatbot logic is in [chat.ts](./src/chat.ts). This uses Restate's Virtual Objects to
have a chat session per user, with history and active tasks easily maintained in the object state.

The workflow-as-code execution of handlers ensures strict consistency and the single-writer semantics
eforce a consistent message history even under concurrent messages or task notifications.

The tasks are simple Restate workflows. See the [flight watch task](./src/tasks/flight_prices.ts) as an example. 

Finally, the [slack integration](./src/slackbot.ts) handles slack webhooks, API calls,
verification, deduplication, tracking message timestamps, etc.


## Running the ChatBot

You need an [OpenAI]() access key to access GPT-4o. Export it as an environment variable like `export OPENAI_API_KEY=sk-proj-...`

Start the Restate Server (see ["Get Restate"](https://restate.dev/get-restate/) if you don't have it downloaded, yet.)

Make sure you install the dependencies via `npm install`.

Start the *reminder* and *flight-watch* tasks via `npm run reminder-task` and `npm run flights-task` respectively
(e.g., in different shells). In this example, we run them as separate endpoints. Since they are mostly suspending,
they would be prime candidates to be deployed on a FaaS platform.

Let Restate know about your task services via
```shell
restate dep add -y localhost:9081
restate dep add -y localhost:9082
```

### Option (1) Without Slack

Start the main chatbot service via `npm run app` and register it at Restate Server `restate dep add -y localhost:9080`.

To chat with the bot, make calls to the chatbot service, like
```
curl localhost:8080/chatSession/<session-name>/chatMessage --json '"Hey, I am Malik, what tasks can you do?"'
curl localhost:8080/chatSession/<session-name>/chatMessage --json '"Create a reminder for in 30 minutes to get a coffee."'
```

The `<session-name>` path identifies the session - each one separately maintains its tasks and history.

Async notifications from tasks (like that a cheap flight was found) come in the chat bot's log, which is a bit hidden,
but a result of the fact that this was initially written to be used with a chat app like Slack.

### Option (2): As a Slack Bot

The chat bot can also be used as a [Slack](https://slack.com/) bot, as shown in the video.
Each slack channel that the bot participates in and each direct message user are separate chat sessions.

The setup is a bit more involved, because you need to create a Slack App as the connection between Slack and
the bot. [This tutorial](https://slack.com/help/articles/13345326945043-Build-apps-with-Slacks-developer-tools)
is a starting point.

For those with some experience in building slack apps, the requirements for this bot are:
* The following *Bot Token OAuth Scopes*: `channels:history`, `chat:write`, `groups:history`, `im:history`, `im:read`, `im:write`, `mpim:history`
* Event subscription for the following *Bot Events*: `message.channels`, `message.groups`, `message.im`, `message.mpim`. 

After installing the app to your workspace, export the following tokens and IDs as environment variables:
```shell
export SLACK_BOT_USER_ID=U...
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
```

Once all keys are set up, start the app together with the slack adapter: `npm run app -- SLACK`.
Use a publicly reachable Restate server URL as Slack's event Request URL: `https://my-restate-uri:8080/slackbot/message`
