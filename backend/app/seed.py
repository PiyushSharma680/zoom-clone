"""Seed the database with a default user and sample meetings.

By default this is NON-DESTRUCTIVE: it only inserts the demo data when it's
missing and never deletes accounts you've created.

    python -m app.seed            # safe: seed only if empty, preserve your data
    python -m app.seed --reset    # wipe ALL tables and reseed a clean demo state
"""
import sys
from datetime import datetime, timedelta

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import ChatMessage, Meeting, Participant, User
from .utils import generate_meeting_code


def run(reset: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if reset:
            # Explicit wipe requested — clear everything for a clean demo state.
            db.query(ChatMessage).delete()
            db.query(Participant).delete()
            db.query(Meeting).delete()
            db.query(User).delete()
            db.commit()
        else:
            # Safe mode: if the default account already exists, do nothing so
            # any accounts/meetings you created are preserved across restarts.
            if db.query(User).filter(User.email == "alex@zoomclone.dev").first():
                print(
                    "Seed skipped — demo data already present; your accounts are preserved."
                )
                print("  Use 'python -m app.seed --reset' to wipe and reseed.")
                return

        # Default logged-in user (per assignment: assume a default user).
        alex = User(
            name="Alex Morgan",
            email="alex@zoomclone.dev",
            hashed_password=hash_password("ZoomDemo2026!"),
            avatar_color="#2D8CFF",
        )
        priya = User(
            name="Priya Sharma",
            email="priya@zoomclone.dev",
            hashed_password=hash_password("ZoomDemo2026!"),
            avatar_color="#6C5CE7",
        )
        db.add_all([alex, priya])
        db.commit()
        db.refresh(alex)
        db.refresh(priya)

        now = datetime.now()

        upcoming = [
            Meeting(
                meeting_code=generate_meeting_code(db),
                title="Weekly Team Standup",
                description="Sprint progress sync and blockers.",
                host_id=alex.id,
                meeting_type="scheduled",
                status="scheduled",
                scheduled_at=now + timedelta(hours=3),
                duration_minutes=30,
            ),
            Meeting(
                meeting_code=generate_meeting_code(db),
                title="Product Design Review",
                description="Review new onboarding flow mockups.",
                host_id=alex.id,
                meeting_type="scheduled",
                status="scheduled",
                scheduled_at=now + timedelta(days=1, hours=2),
                duration_minutes=60,
            ),
            Meeting(
                meeting_code=generate_meeting_code(db),
                title="1:1 with Priya",
                description="Career check-in.",
                host_id=alex.id,
                meeting_type="scheduled",
                status="scheduled",
                scheduled_at=now + timedelta(days=2),
                duration_minutes=45,
            ),
        ]

        recent = [
            Meeting(
                meeting_code=generate_meeting_code(db),
                title="Client Onboarding Call",
                host_id=alex.id,
                meeting_type="instant",
                status="ended",
                created_at=now - timedelta(days=1),
                started_at=now - timedelta(days=1),
                ended_at=now - timedelta(days=1, minutes=-40),
                duration_minutes=40,
            ),
            Meeting(
                meeting_code=generate_meeting_code(db),
                title="Engineering Sync",
                host_id=alex.id,
                meeting_type="instant",
                status="ended",
                created_at=now - timedelta(days=2),
                started_at=now - timedelta(days=2),
                ended_at=now - timedelta(days=2, minutes=-25),
                duration_minutes=25,
            ),
        ]

        db.add_all(upcoming + recent)
        db.commit()

        print("Seed complete.")
        print("  Default login: alex@zoomclone.dev / ZoomDemo2026!")
        print(f"  {len(upcoming)} upcoming, {len(recent)} recent meetings created.")
    finally:
        db.close()


if __name__ == "__main__":
    run(reset="--reset" in sys.argv)
