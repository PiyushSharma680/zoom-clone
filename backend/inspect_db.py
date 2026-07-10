"""Quick database inspector — prints every table and its rows.

Usage:
    python inspect_db.py
"""
from app.database import SessionLocal
from app.models import ChatMessage, Meeting, Participant, User


def line(char="-", n=70):
    print(char * n)


def show(title, rows, columns):
    line("=")
    print(f"  {title}  ({len(rows)} rows)")
    line("=")
    if not rows:
        print("  (empty)\n")
        return
    for r in rows:
        for col in columns:
            print(f"  {col:<16}: {getattr(r, col)}")
        line()
    print()


def main():
    db = SessionLocal()
    try:
        show(
            "USERS",
            db.query(User).all(),
            ["id", "name", "email", "avatar_color", "created_at"],
        )
        show(
            "MEETINGS",
            db.query(Meeting).order_by(Meeting.created_at.desc()).all(),
            [
                "id",
                "meeting_code",
                "title",
                "meeting_type",
                "status",
                "host_id",
                "scheduled_at",
                "duration_minutes",
            ],
        )
        show(
            "PARTICIPANTS",
            db.query(Participant).all(),
            ["id", "meeting_id", "user_id", "display_name", "is_host", "joined_at"],
        )
        show(
            "CHAT_MESSAGES",
            db.query(ChatMessage).all(),
            ["id", "meeting_id", "sender_name", "content", "created_at"],
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
