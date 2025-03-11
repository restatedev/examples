"""
App module to start the chatbot application
"""

import logging
from typing import List, Union

import restate

from chatbot.chat_session import chat_session
from chatbot.taskmanager import workflow_invoker
from chatbot.tasks.flight_price_watcher import flight_price_watcher
from chatbot.tasks.reminder_service import reminder_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

#
# Add all the services that the chatbot application needs
#
services: List[Union[restate.Workflow | restate.Service | restate.VirtualObject]] = []

services.append(chat_session)
services.append(workflow_invoker)
services.append(reminder_service)
services.append(flight_price_watcher)

app = restate.app(services)
