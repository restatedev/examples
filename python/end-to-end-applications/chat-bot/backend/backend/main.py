import logging
import restate
import hypercorn
import asyncio
from typing import Union
from chat_session import chat_session
from tasks.task_executor import task_executor
from tasks.flights.flight_price_watcher import flight_price_watcher
from tasks.reminders.reminder_service import reminder_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Add all the services that the chatbot application needs
services: list[Union[restate.Workflow | restate.Service | restate.VirtualObject]] = (
    list()
)

services.append(chat_session)
services.append(task_executor)
services.append(reminder_service)
services.append(flight_price_watcher)

app = restate.app(services)


if __name__ == "__main__":
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
