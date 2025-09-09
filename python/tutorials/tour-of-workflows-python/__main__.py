import hypercorn.asyncio
import asyncio
import restate

# Import all workflows and services
from app.utils import email_service, user_service
from app.workflows import (
    signup_workflow,
    signup_with_activities,
    signup_with_events,
    signup_with_queries,
    signup_with_retries,
    signup_with_sagas,
    signup_with_signals,
    signup_with_timers,
)

# Create the Restate app with all workflows and services
app = restate.app([
    # Workflows
    signup_workflow,
    signup_with_activities,
    signup_with_events,
    signup_with_queries,
    signup_with_retries,
    signup_with_sagas,
    signup_with_signals,
    signup_with_timers,

    # Utility services
    email_service,
    user_service,
])

if __name__ == "__main__":
    """Entry point for running the app."""
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
