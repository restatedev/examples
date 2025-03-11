"""
VirtualObject for chatbot, which manages the chat history and ongoing tasks.
"""
import logging
from typing import Dict
import typing
import restate

from pydantic import BaseModel

from chatbot.utils import gpt
from chatbot.utils.gpt import ChatEntry
from chatbot.utils.prompt import setup_prompt, tasks_to_prompt, parse_gpt_response
from chatbot.utils.prompt import interpret_command, RunningTask
from chatbot.utils.types import TaskResult

class ChatMessage(BaseModel):
    message: str

class ChatHistory(BaseModel):
    messages: typing.List[ChatEntry]

chat_session = restate.VirtualObject("ChatSession")

@chat_session.handler("onMessage")
async def on_message(ctx: restate.ObjectContext, req: ChatMessage):
    """
    Manage the chat history and ongoing tasks, and call the GPT model to generate a response.
    """
    # append the message to the chat history
    chat_history: list[ChatEntry] = await ctx.get("chat_history") or []
    chat_history.append(ChatEntry(role="user", content=req.message))
    ctx.set("chat_history", chat_history)

    active_tasks: Dict[str, RunningTask] = await ctx.get("tasks") or {}

    # call LLM
    async def chat():
        return await gpt.chat(
            setup_prompt(),
            chat_history,
            [tasks_to_prompt(active_tasks), req.message]
        )
    gpt_response = await ctx.run("call GPT", chat)

    # add the response to the chat history
    chat_history.append(ChatEntry(role="assistant", content=gpt_response["response"]))
    ctx.set("chat_history", chat_history)


    # parse and interpret the command and fork tasks as indicated
    command = parse_gpt_response(gpt_response["response"])
    output = await interpret_command(ctx, ctx.key(), active_tasks, command)

    # persist the new active tasks and updated history
    if output["new_active_tasks"]:
        ctx.set("tasks", output["new_active_tasks"])

    return {
        "message": command.message,
        "quote": output["task_message"]
    }


@chat_session.handler("onTaskDone")
async def on_task_done(ctx: restate.ObjectContext, result: TaskResult):
    """
    Handle the completion of a task and notify the user.
    """
    task_name = result["task_name"]
    task_result = result["result"]

    # Remove task from list of active tasks
    active_tasks: Dict[str, RunningTask] = await ctx.get("tasks") or {}
    if task_name in active_tasks:
        active_tasks.pop(task_name)
    ctx.set("tasks", active_tasks)

    chat_history = await ctx.get("chat_history")
    chat_history.append(ChatEntry(role="system", content=f"The task with name '{task_name}' is finished."))
    ctx.set("chat_history", chat_history)
    logging.info(" --- NOTIFICATION from session %s --- : %s", ctx.key(), f"Task {task_name} says: {task_result}")


@chat_session.handler("getChatHistory", kind="shared")
async def get_chat_history(ctx: restate.ObjectSharedContext):
    """
    Get the chat history for the current chat session.
    """
    return await ctx.get("chat_history") or []