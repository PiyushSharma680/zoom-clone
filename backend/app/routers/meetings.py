"""Meeting routes: instant creation, scheduling, listing, validation, join."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ChatMessage, Meeting, Participant, User
from ..schemas import (
    ChatMessageOut,
    JoinValidateOut,
    MeetingCreate,
    MeetingOut,
    MeetingSchedule,
    ParticipantOut,
)
from ..utils import generate_meeting_code, meeting_to_out

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _normalize_code(code: str) -> str:
    """Accept '81234567890' or '812 3456 7890' and return the stored spaced form."""
    digits = "".join(c for c in code if c.isdigit())
    if len(digits) == 11:
        return f"{digits[:3]} {digits[3:7]} {digits[7:]}"
    return code


@router.post("", response_model=MeetingOut, status_code=201)
def create_instant_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an instant meeting and immediately mark it active."""
    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=payload.title or "Instant Meeting",
        host_id=current_user.id,
        meeting_type="instant",
        status="active",
        started_at=datetime.now(),
        duration_minutes=30,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting_to_out(meeting)


@router.post("/schedule", response_model=MeetingOut, status_code=201)
def schedule_meeting(
    payload: MeetingSchedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=payload.title,
        description=payload.description,
        host_id=current_user.id,
        meeting_type="scheduled",
        status="scheduled",
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting_to_out(meeting)


@router.get("/upcoming", response_model=list[MeetingOut])
def upcoming_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scheduled meetings for this host that haven't ended, sorted soonest-first."""
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.host_id == current_user.id,
            Meeting.meeting_type == "scheduled",
            Meeting.status != "ended",
        )
        .order_by(Meeting.scheduled_at.asc())
        .all()
    )
    return [meeting_to_out(m) for m in meetings]


@router.get("/recent", response_model=list[MeetingOut])
def recent_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recently created/ended meetings for this host, newest first."""
    meetings = (
        db.query(Meeting)
        .filter(Meeting.host_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .limit(10)
        .all()
    )
    return [meeting_to_out(m) for m in meetings]


@router.get("/all", response_model=list[MeetingOut])
def all_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Every meeting owned by the host, newest first (for the Meetings page)."""
    meetings = (
        db.query(Meeting)
        .filter(Meeting.host_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )
    return [meeting_to_out(m) for m in meetings]


@router.get("/validate", response_model=JoinValidateOut)
def validate_meeting(code: str = Query(...), db: Session = Depends(get_db)):
    """Check whether a meeting exists for a given code (used by Join flow)."""
    normalized = _normalize_code(code)
    meeting = (
        db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    )
    if not meeting or meeting.status == "ended":
        return JoinValidateOut(exists=False)
    return JoinValidateOut(exists=True, meeting=meeting_to_out(meeting))


@router.get("/{code}", response_model=MeetingOut)
def get_meeting(code: str, db: Session = Depends(get_db)):
    normalized = _normalize_code(code)
    meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting_to_out(meeting)


@router.get("/{code}/participants", response_model=list[ParticipantOut])
def get_participants(code: str, db: Session = Depends(get_db)):
    normalized = _normalize_code(code)
    meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    active = [p for p in meeting.participants if p.left_at is None]
    return active


@router.get("/{code}/messages", response_model=list[ChatMessageOut])
def get_messages(code: str, db: Session = Depends(get_db)):
    normalized = _normalize_code(code)
    meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.meeting_id == meeting.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.delete("/{code}", status_code=204)
def delete_meeting(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a meeting (host only). Cascades to participants & chat."""
    normalized = _normalize_code(code)
    meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can delete this meeting")
    db.delete(meeting)
    db.commit()
    return None


@router.post("/{code}/end", response_model=MeetingOut)
def end_meeting(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized = _normalize_code(code)
    meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can end the meeting")
    meeting.status = "ended"
    meeting.ended_at = datetime.now()
    db.commit()
    db.refresh(meeting)
    return meeting_to_out(meeting)
