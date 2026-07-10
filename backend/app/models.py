"""SQLAlchemy ORM models — the database schema for the Zoom clone.

Schema overview
---------------
User          A registered account (host or participant).
Meeting       An instant or scheduled meeting. Owned by a host (User).
Participant   Join records linking a User (optional) / display name to a Meeting.
ChatMessage   In-meeting chat messages.

Relationships
-------------
User  1 ─── * Meeting        (a user hosts many meetings)
Meeting 1 ─── * Participant   (a meeting has many participants)
Meeting 1 ─── * ChatMessage   (a meeting has many chat messages)
User  1 ─── * Participant     (a user can appear in many meetings)
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_color = Column(String(20), default="#2D8CFF")  # for the avatar initials tile
    created_at = Column(DateTime, default=datetime.now)

    meetings = relationship(
        "Meeting", back_populates="host", cascade="all, delete-orphan"
    )
    participations = relationship("Participant", back_populates="user")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    # Human-friendly 11-digit Zoom-style meeting id, e.g. "812 3456 7890"
    meeting_code = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False, default="Instant Meeting")
    description = Column(Text, nullable=True)

    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # "instant" | "scheduled"
    meeting_type = Column(String(20), default="instant", nullable=False)
    # "scheduled" | "active" | "ended"
    status = Column(String(20), default="active", nullable=False)

    scheduled_at = Column(DateTime, nullable=True)  # for scheduled meetings
    duration_minutes = Column(Integer, default=30)

    passcode = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.now)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    host = relationship("User", back_populates="meetings")
    participants = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan"
    )
    messages = relationship(
        "ChatMessage", back_populates="meeting", cascade="all, delete-orphan"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = guest

    display_name = Column(String(120), nullable=False)
    is_host = Column(Boolean, default=False)

    joined_at = Column(DateTime, default=datetime.now)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="participations")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    sender_name = Column(String(120), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    meeting = relationship("Meeting", back_populates="messages")
