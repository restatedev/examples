import asyncio
import aiohttp
from typing import Dict, Any

async def submit_workflow(id: str, name: str, email: str, workflow_name: str = "user-signup") -> Dict[str, Any]:
    """
    Submit a workflow using HTTP REST API calls to the Restate server.
    
    Args:
        id: Workflow ID (used as key)
        name: User name
        email: User email
        workflow_name: Name of the workflow to invoke
    
    Returns:
        The workflow result
    """
    url = f"http://localhost:8080/{workflow_name}/{id}/run"
    user_data = {"name": name, "email": email}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=user_data) as response:
            if response.status == 200:
                result = await response.json()
                print(f"Workflow {workflow_name} completed successfully: {result}")
                return result
            else:
                error_text = await response.text()
                print(f"Error submitting workflow: {response.status} - {error_text}")
                return {"success": False, "error": error_text}

async def submit_workflow_async(id: str, name: str, email: str, workflow_name: str = "user-signup") -> str:
    """
    Submit a workflow asynchronously (fire-and-forget) and return the invocation ID.
    """
    url = f"http://localhost:8080/{workflow_name}/{id}/run/send"
    user_data = {"name": name, "email": email}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=user_data) as response:
            if response.status == 200:
                result = await response.json()
                invocation_id = result.get("invocationId", "unknown")
                print(f"Workflow {workflow_name} submitted asynchronously. Invocation ID: {invocation_id}")
                return invocation_id
            else:
                error_text = await response.text()
                print(f"Error submitting workflow: {response.status} - {error_text}")
                return ""

async def query_workflow_status(workflow_name: str, id: str, handler_name: str = "get_status") -> Dict[str, Any]:
    """
    Query workflow status using a shared handler.
    """
    url = f"http://localhost:8080/{workflow_name}/{id}/{handler_name}"
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url) as response:
            if response.status == 200:
                result = await response.json()
                print(f"Workflow status: {result}")
                return result
            else:
                error_text = await response.text()
                print(f"Error querying workflow status: {response.status} - {error_text}")
                return {"error": error_text}

async def verify_email(workflow_name: str, id: str, secret: str) -> bool:
    """
    Verify email for signals/timers workflows.
    """
    url = f"http://localhost:8080/{workflow_name}/{id}/verify_email"
    data = {"secret": secret}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as response:
            if response.status == 200:
                print(f"Email verification sent for {workflow_name}/{id}")
                return True
            else:
                error_text = await response.text()
                print(f"Error verifying email: {response.status} - {error_text}")
                return False

async def main():
    """
    Example usage of the Python Restate client.
    """
    print("=== Testing Basic Signup Workflow ===")
    await submit_workflow("user-123", "John Doe", "john@mail.com", "user-signup")
    
    print("\n=== Testing Signup with Activities ===")
    await submit_workflow("user-124", "Jane Smith", "jane@mail.com", "signup-with-activities")
    
    print("\n=== Testing Signup with Queries ===")
    await submit_workflow_async("user-125", "Bob Wilson", "bob@mail.com", "signup-with-queries")
    await asyncio.sleep(1)  # Give workflow time to start
    await query_workflow_status("signup-with-queries", "user-125", "get_status")
    
    print("\n=== Testing Signup with Events ===")
    await submit_workflow_async("user-126", "Alice Johnson", "alice@mail.com", "signup-with-events")
    await asyncio.sleep(1)  # Give workflow time to start
    
    print("\n=== Testing Signup with Signals ===")
    await submit_workflow_async("user-127", "Charlie Brown", "charlie@mail.com", "signup-with-signals")
    await asyncio.sleep(1)  # Give workflow time to start
    # To complete this, you would need to call verify_email with the secret from the logs
    
    print("\n=== Testing Signup with Retries ===")
    await submit_workflow("user-128", "Diana Prince", "diana@mail.com", "signup-with-retries")
    
    print("\n=== Testing Signup with Sagas ===")
    await submit_workflow("user-129", "Eve Adams", "eve@mail.com", "signup-with-sagas")

if __name__ == "__main__":
    asyncio.run(main())