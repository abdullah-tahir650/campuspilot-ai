
import os
import secrets
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from mcp.server.auth.provider import TokenVerifier, AccessToken
from mcp.server.auth.settings import AuthSettings

from mcp.server.transport_security import TransportSecuritySettings


from backend.database import (
    init_db,
    create_task as db_create_task,
    list_tasks as db_list_tasks,
    complete_task as db_complete_task,
    reopen_task as db_reopen_task,
    delete_task as db_delete_task,
)

load_dotenv()

MCP_ACCESS_TOKEN = os.getenv("MCP_ACCESS_TOKEN")

if not MCP_ACCESS_TOKEN:
    raise RuntimeError(
        "MCP_ACCESS_TOKEN is missing. Add it to your .env file."
    )


class StaticTokenVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> AccessToken | None:
        if not secrets.compare_digest(token, MCP_ACCESS_TOKEN):
            return None

        return AccessToken(
            token=token,
            client_id="campuspilot-client",
            scopes=["tasks:read", "tasks:write"],
        )



mcp = FastMCP(
    "CampusPilot AI",
    host="127.0.0.1",
    port=8001,
    token_verifier=StaticTokenVerifier(),
    auth=AuthSettings(
        issuer_url="https://magazine-against-governments-dressing.trycloudflare.com",
        resource_server_url="https://magazine-against-governments-dressing.trycloudflare.com/",
        required_scopes=["tasks:read", "tasks:write"],
        validate_token_resource=False,
    ),
    transport_security=TransportSecuritySettings(
        allowed_hosts=[
            "magazine-against-governments-dressing.trycloudflare.com",
            "magazine-against-governments-dressing.trycloudflare.com:443",
            "localhost:8001",
            "127.0.0.1:8001",
        ],
        allowed_origins=[
            "https://magazine-against-governments-dressing.trycloudflare.com",
        ],
    ),
)

@mcp.tool()
def list_tasks(include_completed: bool = True) -> dict:
    """List CampusPilot student tasks."""
    init_db()
    tasks = db_list_tasks(include_completed=include_completed)
    return {"success": True, "count": len(tasks), "tasks": tasks}


@mcp.tool()
def create_task(
    title: str,
    description: str = "",
    due_date: str = "",
) -> dict:
    """Create a student task."""
    init_db()
    try:
        task = db_create_task(
            title=title,
            description=description,
            due_date=due_date,
        )
        return {"success": True, "task": task}
    except ValueError as exc:
        return {"success": False, "error": str(exc)}


@mcp.tool()
def complete_task(task_id: int) -> dict:
    """Mark a task as completed."""
    init_db()
    task = db_complete_task(task_id)
    if task is None:
        return {"success": False, "error": f"Task {task_id} was not found."}
    return {"success": True, "task": task}


@mcp.tool()
def reopen_task(task_id: int) -> dict:
    """Reopen a completed task."""
    init_db()
    task = db_reopen_task(task_id)
    if task is None:
        return {"success": False, "error": f"Task {task_id} was not found."}
    return {"success": True, "task": task}


@mcp.tool()
def delete_task(task_id: int) -> dict:
    """Permanently delete a task."""
    init_db()
    deleted = db_delete_task(task_id)
    if not deleted:
        return {"success": False, "error": f"Task {task_id} was not found."}
    return {"success": True, "message": f"Task {task_id} deleted."}


if __name__ == "__main__":
    init_db()
    mcp.run(transport="streamable-http")
