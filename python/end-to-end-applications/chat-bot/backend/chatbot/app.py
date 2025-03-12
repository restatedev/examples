"""
App module to start the chatbot application
"""

import logging
import restate
from typing import List, Union
from chatbot.chat_session import chat_session
from chatbot.tasks.task_executor import task_executor
from chatbot.tasks.flights.flight_price_watcher import flight_price_watcher
from chatbot.tasks.reminders.reminder_service import reminder_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

#
# Add all the services that the chatbot application needs
#
services: List[Union[restate.Workflow | restate.Service | restate.VirtualObject]] = []

services.append(chat_session)
services.append(task_executor)
services.append(reminder_service)
services.append(flight_price_watcher)

app = restate.app(services)
