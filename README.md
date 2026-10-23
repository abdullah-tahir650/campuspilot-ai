# CampusPilot AI

**An AI-powered study assistant for managing academic tasks, deadlines, and study plans.**

CampusPilot AI helps students organize assignments, track academic progress, and manage their workload through a natural-language AI assistant and a browser-based Alexa-style interface.

Built for the **Alexa+ track** of the Build, Ship, Shape: Amazon Developer Hackathon, CampusPilot AI combines a Gemini-powered assistant, a FastAPI backend, SQLite storage, and a self-hosted Model Context Protocol (MCP) server.

## Project Links

- **GitHub Repository:** https://github.com/abdullah-tahir650/campuspilot-ai
- **Demo Video:** https://youtu.be/NrQNU50504U
- **Primary Track:** Alexa+

**Note:** CampusPilot Voice is a browser-based Alexa-style simulation. It demonstrates conversational interaction with the CampusPilot task-management system and is not an official integration with a physical Alexa+ device.

## Features

- **AI Study Assistant:** Interact with an AI assistant using natural language to get study advice and planning assistance.
- **Academic Task Management:** Create, list, complete, reopen, and delete tasks.
- **Task Organization:** Organize academic work using task titles, descriptions, deadlines, and available priority or subject fields.
- **Progress Dashboard:** View task totals, completed and pending tasks, and completion progress.
- **Study Planning:** Review outstanding tasks and organize work around deadlines and priorities.
- **MCP Integration:** Expose task-management operations through five MCP tools.
- **Alexa-Style Browser Simulation:** Demonstrate conversational productivity interactions through a dedicated browser interface.
- **Persistent Storage:** Store tasks in an SQLite database so task information remains available between application sessions.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML | Frontend structure |
| CSS | Layout and styling |
| JavaScript | Frontend interactions and API requests |
| Python | Backend and server logic |
| FastAPI | REST API and chat endpoints |
| Google Gemini API | AI-powered study assistance |
| Google Gen AI SDK | Communication with Gemini |
| MCP Python SDK | MCP server and client integration |
| Streamable HTTP | MCP communication |
| SQLite | Persistent task storage |
| Cloudflare Tunnel | Optional temporary public access for demonstrations |

## Architecture

CampusPilot AI consists of four main components:

1. **Frontend:** Provides the student dashboard, task controls, AI chat interface, and Alexa-style browser simulation.
2. **FastAPI Backend:** Handles API requests, coordinates AI interactions, and manages communication with the task-management system.
3. **MCP Server:** Exposes task-management operations through MCP tools over Streamable HTTP.
4. **SQLite Database:** Stores tasks and their associated information.

### Chat Workflow

A typical conversational task-management workflow is:

`Student → Frontend → FastAPI → Gemini → MCP Client → MCP Server → SQLite Database`

The application also provides REST endpoints for direct task-management operations.

## MCP Tools

The MCP server exposes the following task-management tools:

| Tool | Description |
|---|---|
| `list_tasks` | Retrieve student tasks, optionally including completed tasks |
| `create_task` | Create a task with a title, description, and due date |
| `complete_task` | Mark a task as completed |
| `reopen_task` | Reopen a completed task |
| `delete_task` | Delete a task |

The chat interface is designed to request confirmation before deleting a task. Verify this behavior in the running application before relying on it.

## Requirements

- Python 3.10 or later, compatible with the installed dependencies
- A valid Google Gemini API key
- Visual Studio Code or another code editor
- A modern web browser, such as Chrome or Edge
- The Live Server extension for Visual Studio Code, for local frontend development

## Setup and Installation

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/abdullah-tahir650/campuspilot-ai.git
cd campuspilot-ai
```

### 2. Create a Virtual Environment

On Windows PowerShell:

```powershell
python -m venv .venv
```

Activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

If activation is unavailable in your terminal, you can run commands directly using the Python executable inside `.venv`.

### 3. Install Dependencies

Run:

```powershell
python -m pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a local `.env` file using `.env.example` as a template.

Add your own Gemini API key and any other configuration variables required by your current application code.

Example configuration:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
MCP_ACCESS_TOKEN=your_private_random_token
MCP_SERVER_URL=http://localhost:8001/mcp
```

Replace the example values with valid values that match your application configuration. The Gemini model ID must be supported by your API account and match what your code expects.

The MCP access token should only be included if the current MCP server and client use it for authentication. Configure the server and client consistently.

**Security:** Never commit your real `.env` file, API keys, private tokens, or other credentials to GitHub. Commit `.env.example` only when it contains placeholders rather than real secrets.

### 5. Start the MCP Server

Open a terminal in the repository root and run:

```powershell
.\.venv\Scripts\python.exe -m backend.mcp_server
```

The MCP server is configured to use port `8001` by default. Keep this terminal running.

### 6. Start the FastAPI Backend

Open a second terminal in the repository root and run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

The FastAPI application will normally be available at `http://127.0.0.1:8000`.

Useful endpoints include:

| Endpoint | Purpose |
|---|---|
| `http://127.0.0.1:8000/` | Application root |
| `http://127.0.0.1:8000/health` | Health check |
| `http://127.0.0.1:8000/docs` | Interactive API documentation |
| `http://127.0.0.1:8000/tasks` | Task API |
| `http://127.0.0.1:8000/api/chat` | AI chat endpoint |
| `http://127.0.0.1:8000/alexa-demo` | Alexa-style interface, if the route is installed and enabled |

The endpoints available in your running application may vary with the current project version.

### 7. Start the Frontend

Open the project in Visual Studio Code.

Open the `Frontend` folder and use the Live Server extension to serve `index.html`.

If Live Server is launched from the project root, the frontend will typically be available at:

`http://127.0.0.1:5500/Frontend/index.html`

If you open the `Frontend` folder itself in Visual Studio Code, the URL may instead be:

`http://127.0.0.1:5500/index.html`

Make sure the frontend is configured to communicate with the running FastAPI backend.

Keep the backend and MCP server running while testing features that depend on them.

## Testing the MCP Server

You can use MCP Inspector to examine and test the available MCP tools.

1. Start the MCP server.
2. Launch MCP Inspector.
3. Configure a connection to the MCP endpoint exposed by your server using Streamable HTTP.
4. Provide authentication credentials if authentication is enabled in your current implementation.
5. Inspect the available tools and test task operations.

Verify tool responses, task updates, and database persistence before considering the integration fully tested.

## Security Considerations

- Keep API keys and private configuration in `.env`.
- Use `.env.example` to document the required configuration variables.
- Do not commit `.venv`, private credentials, or personal task data.
- Verify that authentication is enabled and enforced before exposing the MCP server or backend publicly.
- The REST task endpoints may not provide application-level user authentication. Do not expose an unrestricted backend containing personal data to the public internet.
- Cloudflare Quick Tunnels provide temporary demonstration access and should not be treated as permanent hosting.

## Hackathon Track

**Primary Track: Alexa+**

CampusPilot AI demonstrates conversational productivity interactions through an Alexa-style browser simulation connected to a student task-management application.

Its use of MCP provides a way to expose task-management capabilities as tools that an AI-enabled workflow can call. The browser simulation is a demonstration interface and does not represent an official physical Alexa+ integration.

## Future Improvements

- Stable cloud deployment with appropriate access controls
- More advanced multi-step AI workflows
- Improved deadline reminders and personalized study planning
- User profiles and individualized academic preferences
- Better accessibility and voice-interaction capabilities
- Additional testing and stronger application security

## License

This project is intended to be released under the MIT License.

See the [LICENSE](LICENSE) file for the license terms.

