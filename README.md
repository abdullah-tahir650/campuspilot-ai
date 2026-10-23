# CampusPilot AI

**An AI-powered student productivity assistant with MCP and an Alexa-style browser simulation.**

CampusPilot AI helps students organize assignments, manage deadlines, track academic progress, and interact with their task manager using natural language.

Built for the **Alexa+ track** of the Build, Ship, Shape: Amazon Developer Hackathon, the project combines a Gemini-powered assistant, a FastAPI backend, SQLite task storage, and a self-hosted Model Context Protocol (MCP) server using Streamable HTTP.

## Demo

**Demo video:** [Insert your public YouTube or Vimeo link]

**Primary track:** Alexa+

CampusPilot Voice is a browser-based, Alexa-style simulation. It demonstrates conversational interaction with the existing CampusPilot task-management system; it is not an official integration with a physical Alexa+ device.

## Features

- **AI study assistant:** Understands natural-language requests and provides study advice and planning assistance.
- **Task management:** Create, list, complete, reopen, and delete academic tasks.
- **Task organization:** Store task titles, subjects, deadlines, priorities, and completion status.
- **Progress dashboard:** Display total, completed, and pending tasks, along with a completion percentage.
- **Study planner:** Present outstanding tasks organized by deadline and priority.
- **MCP integration:** Expose task-management capabilities through five MCP tools over Streamable HTTP.
- **Alexa-style simulation:** Provide a browser-based interface for conversational interaction with the assistant.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend dashboard and interactions |
| Python | Application and MCP server logic |
| FastAPI | REST API and chat endpoints |
| Google Gemini API | Natural-language understanding and study assistance |
| Google Gen AI SDK | Communication with Gemini |
| Model Context Protocol (MCP) Python SDK | MCP server and client integration |
| Streamable HTTP | MCP client-server communication |
| SQLite | Persistent task storage |
| Cloudflare Tunnel | Optional temporary public access for demonstrations |

## Architecture

The application has four main components:

1. **Frontend:** The student dashboard, task controls, AI chat, and Alexa-style browser simulation.
2. **FastAPI backend:** Provides REST endpoints, coordinates AI responses, validates requests, and routes chat-based task operations through MCP.
3. **MCP server:** Exposes the task-management tools through Streamable HTTP and verifies bearer-token authentication.
4. **SQLite database:** Stores tasks and their completion status, deadlines, and metadata.

The chat workflow is:

`Student → Frontend → FastAPI → Gemini intent classification → MCP client → MCP server tools → SQLite database`

The dashboard's existing REST task endpoints remain available as well.

## MCP Tools

The self-hosted MCP server exposes the following tools:

| Tool | Description |
|---|---|
| `list_tasks` | Retrieve student tasks, optionally including completed tasks |
| `create_task` | Create a task with a title, description, and due date |
| `complete_task` | Mark a task as completed |
| `reopen_task` | Reopen a completed task |
| `delete_task` | Permanently delete a task |

The chat interface requires explicit confirmation before deleting a task.

## Requirements

- Python 3.10 or later, compatible with the installed dependencies
- A Google Gemini API key
- A modern browser such as Chrome or Edge
- Visual Studio Code and the Live Server extension for serving the frontend during local development

## Setup and Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd campuspilot-ai
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual repository URL.

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a local `.env` file based on `.env.example`.

Set the following variables:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash
MCP_ACCESS_TOKEN=your_private_random_token
MCP_SERVER_URL=http://localhost:8001/mcp
```

Use your own valid Gemini API key and generate a private, unpredictable MCP access token. Never commit the real `.env` file or share credentials publicly.

The MCP client defaults to `http://localhost:8001/mcp` when `MCP_SERVER_URL` is not configured.

**MCP server configuration:** For local development, configure the MCP server's `issuer_url` and `resource_server_url` for the local server as required by the installed MCP SDK. For public tunnel access, update the advertised resource URL and allowed host settings to match the current public hostname. Cloudflare Quick Tunnel URLs are temporary and should not be treated as permanent deployment addresses.

### 5. Start the MCP server

Open a terminal in the repository root and run:

```powershell
.\.venv\Scripts\python.exe -m backend.mcp_server
```

The MCP server uses port `8001` by default. Keep this terminal running.

### 6. Start the FastAPI backend

Open a second terminal in the repository root and run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

The API is available locally at:

- Application health: `http://127.0.0.1:8000/health`
- API documentation: `http://127.0.0.1:8000/docs`
- Chat endpoint: `http://127.0.0.1:8000/api/chat`
- Alexa-style simulation: `http://127.0.0.1:8000/alexa-demo`

The Alexa-style route is available when the simulation files and route have been installed in the project.

### 7. Start the frontend

Open `frontend/index.html` in Visual Studio Code and select **Open with Live Server**.

The frontend is normally available at:

`http://127.0.0.1:5500`

Keep the backend and MCP server running while using the application locally.

## Testing the MCP Server

To inspect and test the available tools:

1. Start the MCP server.
2. Launch MCP Inspector.
3. Connect using Streamable HTTP to the configured MCP endpoint.
4. Supply the appropriate bearer token through the Authorization header.
5. Inspect the available tools and invoke them to verify their responses.

The task tools have been tested against the project's SQLite database during development.

## Security Notes

- Keep `.env`, API keys, and bearer tokens out of the repository.
- Use `.env.example` for documenting required configuration.
- Do not commit `.venv` or private task data.
- The existing REST task endpoints do not include application-level user authentication. Avoid exposing the backend publicly without appropriate access controls.
- Cloudflare Quick Tunnels are temporary demonstration tunnels, not permanent hosting.

## Hackathon Track

**Primary track:** Alexa+

This project demonstrates a self-hosted MCP server with Streamable HTTP and a browser-based Alexa-style simulation. The simulation reuses CampusPilot's task-management backend and MCP-connected chat workflow to demonstrate conversational productivity interactions.

## Future Improvements

- Stable cloud deployment with secure access controls
- More advanced multi-step agent workflows
- Additional study-planning and deadline-management features
- Persistent user profiles and personalized study preferences
- Further improvements to accessibility and voice interaction

## License

[Specify the open-source license used for this project.]

For a public hackathon repository, include the full text of your chosen license in a `LICENSE` file and ensure the license is visible on the GitHub repository page.


