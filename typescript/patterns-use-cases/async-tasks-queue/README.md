# Async Tasks: (Delayed) Tasks Queue

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once. 

Files to look at:
- [Task Submitter](src/task_submitter.ts): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response. 
    - The **idempotency key** in the header is used by Restate to deduplicate requests. 
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/async_task_worker.ts): gets invoked by Restate for each task in the queue. 