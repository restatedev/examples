import asyncio
import httpx


async def main():
    # <start_submit>
    key = "user-123"
    url = "http://127.0.0.1:8080/SignupWorkflow/" + key + "/run"

    payload = {"name": "John Doe", "email": "john@mail.com"}
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    response = httpx.post(url, json=payload, headers=headers)
    # <end_submit>

    print(response.json())


if __name__ == "__main__":
    asyncio.run(main())
