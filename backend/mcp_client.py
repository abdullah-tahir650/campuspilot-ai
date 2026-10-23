import asyncio
import json
import os

from dotenv import load_dotenv
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

load_dotenv()

MCP_SERVER_URL = os.getenv(
    "MCP_SERVER_URL",
    "http://localhost:8001/mcp",
).strip()

MCP_ACCESS_TOKEN = os.getenv("MCP_ACCESS_TOKEN", "").strip()


def _decode_result(result) -> dict:
    """Convert an MCP tool result into a Python dictionary."""

    structured = getattr(result, "structuredContent", None)

    if structured is None:
        structured = getattr(result, "structured_content", None)

    if isinstance(structured, dict):
        return structured

    content = getattr(result, "content", []) or []

    for item in content:
        text = getattr(item, "text", None)

        if not text:
            continue

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            continue

        if isinstance(parsed, dict):
            return parsed

    raise RuntimeError(
        "MCP returned an unreadable tool response."
    )


async def _call_mcp_tool_async(
    tool_name: str,
    arguments: dict,
) -> dict:
    """Connect to MCP, call one tool, and return its result."""

    if not MCP_ACCESS_TOKEN:
        raise RuntimeError(
            "MCP_ACCESS_TOKEN is missing from the .env file."
        )

    headers = {
        "Authorization": f"Bearer {MCP_ACCESS_TOKEN}",
    }

    async with streamablehttp_client(
        MCP_SERVER_URL,
        headers=headers,
    ) as (read_stream, write_stream, _get_session_id):

        async with ClientSession(
            read_stream,
            write_stream,
        ) as session:

            await session.initialize()

            result = await session.call_tool(
                tool_name,
                arguments=arguments,
            )

            if getattr(result, "isError", False):
                raise RuntimeError(
                    f"MCP tool '{tool_name}' returned an error."
                )

            return _decode_result(result)


def call_mcp_tool(
    tool_name: str,
    arguments: dict,
) -> dict:
    """Synchronous wrapper for the existing FastAPI chat route."""

    try:
        return asyncio.run(
            _call_mcp_tool_async(tool_name, arguments)
        )
    except Exception as error:
        raise RuntimeError(
            f"Could not call MCP tool '{tool_name}': {error}"
        ) from error