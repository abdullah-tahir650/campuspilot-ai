"""Routes for the CampusPilot voice-assistant demo page."""
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()
DEMO_FILE = Path(__file__).resolve().parent.parent / "frontend" / "alexa-demo.html"


@router.get("/alexa-demo", include_in_schema=False)
def alexa_demo_page():
    """Serve the Alexa+-style browser simulation from the API origin."""
    return FileResponse(DEMO_FILE, media_type="text/html")
