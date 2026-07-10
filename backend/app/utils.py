"""Small shared utilities."""
import random

from sqlalchemy.orm import Session

from .config import settings
from .models import Meeting


def generate_meeting_code(db: Session) -> str:
    """Generate a unique Zoom-style 11-digit meeting code (grouped 3-4-4)."""
    while True:
        digits = "".join(str(random.randint(0, 9)) for _ in range(11))
        code = f"{digits[:3]} {digits[3:7]} {digits[7:]}"
        if not db.query(Meeting).filter(Meeting.meeting_code == code).first():
            return code


def invite_link(meeting_code: str) -> str:
    """Build a shareable invite link for a meeting code."""
    frontend = settings.frontend_url.strip().rstrip("/") or "http://localhost:3000"
    slug = meeting_code.replace(" ", "")
    return f"{frontend}/meeting/{slug}"


def meeting_to_out(meeting: Meeting) -> dict:
    """Serialise a Meeting ORM object into the MeetingOut shape."""
    return {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "description": meeting.description,
        "meeting_type": meeting.meeting_type,
        "status": meeting.status,
        "scheduled_at": meeting.scheduled_at,
        "duration_minutes": meeting.duration_minutes,
        "passcode": meeting.passcode,
        "created_at": meeting.created_at,
        "host": meeting.host,
        "invite_link": invite_link(meeting.meeting_code),
        "participant_count": len(
            [p for p in meeting.participants if p.left_at is None]
        ),
    }
