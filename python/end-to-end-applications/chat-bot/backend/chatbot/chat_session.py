import restate
import time

from chatbot.gpt import gpt_client
from chatbot.gpt.gpt_parser import parse_to_command
from chatbot.gpt.prompt_utils import to_prompt
from chatbot.utils.command_router import execute_command
from chatbot.utils.types import TaskResult, ChatEntry

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
    chat_history = await ctx.get("chat_history") or []
    active_tasks = await ctx.get("active_tasks") or {}

    # Append the message to the chat history
    chat_history.append(message)
    ctx.set("chat_history", chat_history)

    # Call LLM
    gpt_response = await ctx.run("call GPT",
                                 lambda: gpt_client.chat(to_prompt(chat_history, active_tasks, message)))

    # Interpret the response and execute the command
    command = parse_to_command(gpt_response)
    output = await execute_command(ctx, ctx.key(), active_tasks, command)
    ctx.set("active_tasks", output["new_active_tasks"])
    chat_history.append(ChatEntry(
        role="system",
        content=command.message,
        timestamp=await ctx.run("time", lambda: round(time.time() * 1000))))
    ctx.set("chat_history", chat_history)


@chat_session.handler("onTaskDone")
async def on_task_done(ctx: restate.ObjectContext, result: TaskResult):
    """
    Handle the completion of a task and notify the user.
    """
    # Remove task from list of active tasks
    active_tasks = await ctx.get("tasks") or {}
    if result["task_name"] in active_tasks:
        active_tasks.pop(result["task_name"])
    ctx.set("active_tasks", active_tasks)

    # Add the task result to the chat history
    chat_history = await ctx.get("chat_history")
    chat_history.append(ChatEntry(
        role="system",
        content=result["result"],
        timestamp=result["timestamp"]))
    ctx.set("chat_history", chat_history)


@chat_session.handler("getChatHistory", kind="shared")
async def get_chat_history(ctx: restate.ObjectSharedContext):
    return await ctx.get("chat_history") or []