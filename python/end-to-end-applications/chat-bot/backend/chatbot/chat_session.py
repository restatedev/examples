import restate
import time

from chatbot.utils.types import ActiveTasks
from gpt import gpt_client
from gpt.gpt_parser import parse_to_command
from gpt.prompt_utils import to_prompt
from utils.command_router import execute_command
from utils.types import TaskResult, ChatEntry, ChatHistory
from restate.serde import PydanticJsonSerde

"""
Virtual Object representing a chat session which manages the chat history and its ongoing tasks.
"""
chat_session = restate.VirtualObject("ChatSession")


@chat_session.handler("onMessage")
async def on_message(ctx: restate.ObjectContext, message: ChatEntry):
    """
    Manage the chat history and ongoing tasks, and call the GPT model to generate a response.
    """
    # Retrieve the session state
    chat_history = await ctx.get(
        "chat_history", serde=PydanticJsonSerde(ChatHistory)
    ) or ChatHistory(entries=[])
    active_tasks = await ctx.get(
        "active_tasks", serde=PydanticJsonSerde(ActiveTasks)
    ) or ActiveTasks(tasks={})

    # Append the message to the chat history
    chat_history.entries.append(message)
    ctx.set("chat_history", chat_history, serde=PydanticJsonSerde(ChatHistory))

    # Call LLM
    prompt = to_prompt(chat_history, active_tasks, message)
    gpt_response = await ctx.run("call GPT", lambda: gpt_client.chat(prompt))

    # Interpret the response and execute the command
    command = parse_to_command(gpt_response)
    output = await execute_command(ctx, ctx.key(), active_tasks, command)
    ctx.set("active_tasks", output["new_active_tasks"], serde=PydanticJsonSerde(ActiveTasks))
    chat_history.entries.append(
        ChatEntry(
            role="system",
            content=command.message,
            timestamp=await ctx.run("time", lambda: round(time.time() * 1000)),
        )
    )
    ctx.set("chat_history", chat_history, serde=PydanticJsonSerde(ChatHistory))


@chat_session.handler("onTaskDone")
async def on_task_done(ctx: restate.ObjectContext, result: TaskResult):
    """
    Handle the completion of an async task and attach the response to the chat history.
    """
    # Remove task from list of active tasks
    active_tasks = await ctx.get(
        "active_tasks", serde=PydanticJsonSerde(ActiveTasks)
    ) or ActiveTasks(tasks={})
    if result.task_name in active_tasks.tasks:
        active_tasks.tasks.pop(result.task_name)
    ctx.set("active_tasks", active_tasks, serde=PydanticJsonSerde(ActiveTasks))

    # Add the task result to the chat history
    chat_history = await ctx.get(
        "chat_history", serde=PydanticJsonSerde(ChatHistory)
    ) or ChatHistory(entries=[])
    chat_history.entries.append(
        ChatEntry(
            role="system", content=result.result, timestamp=result.timestamp
        )
    )
    ctx.set("chat_history", chat_history, serde=PydanticJsonSerde(ChatHistory))


@chat_session.handler("getChatHistory", kind="shared")
async def get_chat_history(ctx: restate.ObjectSharedContext)-> ChatHistory:
    return await ctx.get(
        "chat_history", serde=PydanticJsonSerde(ChatHistory)
    ) or ChatHistory(entries=[])
