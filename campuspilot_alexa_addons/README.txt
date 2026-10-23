CAMPUSPILOT VOICE DEMO ADD-ON
============================

Purpose
-------
Adds a browser-based Alexa+-style simulation to the existing CampusPilot project.
It uses your already-working /api/chat endpoint; task actions reach your configured MCP client/server through that backend.
This is a simulation for a hackathon demo, not an official Amazon Alexa or Alexa+ device integration.

Files in this package
---------------------
backend/alexa_demo.py
frontend/alexa-demo.html

Install in your existing project (fastest way)
-----------------------------------------------
1. Extract this ZIP into the root of your existing campuspilot-ai project, so the folder campuspilot_alexa_addons sits next to backend and frontend.

2. Open PowerShell at the campuspilot-ai project root and run:

    .\campuspilot_alexa_addons\install_alexa_demo.ps1

   The installer copies two new files, adds the router import and route registration to backend/main.py, and keeps a backup before editing. It does not replace your existing main.py.

3. If PowerShell blocks the script for this window, run:

    Set-ExecutionPolicy -Scope Process RemoteSigned
    .\campuspilot_alexa_addons\install_alexa_demo.ps1

4. Save. Restart FastAPI if it does not reload automatically:

    .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload

5. Keep your MCP server running in its own terminal. Open this URL locally:

    http://127.0.0.1:8000/alexa-demo

   The page is served by FastAPI itself and calls /api/chat on the same origin. Use this URL, not Live Server, for the voice demo.

Voice input
-----------
Voice input depends on browser support and microphone permission. Chrome or Edge are recommended. Text input remains available as a fallback. Spoken replies use the browser's speech synthesis.

Public demo with your existing Cloudflare Quick Tunnels
------------------------------------------------------
Your current MCP tunnel exposes port 8001 for remote MCP clients. To expose the voice demo web app too, start another Cloudflare Quick Tunnel in a separate terminal, forwarding port 8000:

    & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000

Use the newly printed https://...trycloudflare.com URL and open:

    https://NEW-API-TUNNEL.trycloudflare.com/alexa-demo

Keep both tunnels and both Python server processes open while presenting. Quick Tunnel URLs are temporary and may change after restarting.

IMPORTANT SECURITY LIMIT
------------------------
The existing FastAPI task REST endpoints do not have user authentication. A public tunnel to port 8000 therefore exposes those endpoints to anyone who gets the link. Use only disposable/demo data, share the URL only with intended evaluators, keep the tunnel open only during the demo, and stop it immediately afterward. This Quick Tunnel is a temporary demo exposure, not production hosting. Do not claim it is a production-secure deployment.

Final demo run order
-------------------
1. Start MCP server (port 8001).
2. Start FastAPI (port 8000).
3. Start Cloudflare tunnel for port 8001 if external MCP access is needed.
4. Start Cloudflare tunnel for port 8000 if evaluators need to open the voice demo remotely.
5. Open /alexa-demo. Test one short voice or typed request; task CRUD has already been tested.
6. Stop public tunnels after the judging/demo session.
