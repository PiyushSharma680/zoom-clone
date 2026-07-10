"""Pydantic schemas — request/response contracts for the API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    avatar_color: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Meetings ----------
class MeetingCreate(BaseModel):
    """Instant meeting."""
    title: Optional[str] = "Instant Meeting"


class MeetingSchedule(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = Field(30, ge=5, le=1440)


class HostOut(BaseModel):
    id: int
    name: str
    avatar_color: str

    class Config:
        from_attributes = True


class MeetingOut(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: Optional[str]
    meeting_type: str
    status: str
    scheduled_at: Optional[datetime]
    duration_minutes: int
    passcode: Optional[str]
    created_at: datetime
    host: HostOut
    invite_link: str
    participant_count: int = 0

    class Config:
        from_attributes = True


class ParticipantOut(BaseModel):
    id: int
    display_name: str
    is_host: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class JoinValidateOut(BaseModel):
    exists: bool
    meeting: Optional[MeetingOut] = None


class ChatMessageOut(BaseModel):
    id: int
    sender_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
