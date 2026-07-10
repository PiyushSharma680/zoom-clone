-- ============================================================
--  Zoom Clone — Sample SQLite Queries
--  Usage:  sqlite3 zoom_clone.db < queries.sql
--     or:  open the file line-by-line inside the sqlite3 shell.
--  Run `sqlite3 zoom_clone.db` first, then paste any block below.
-- ============================================================

.headers on
.mode column

-- ---- Schema ----
.tables
-- .schema users
-- .schema meetings
-- .schema participants
-- .schema chat_messages

-- ---- Users ----
SELECT id, name, email, avatar_color, created_at
FROM users;

-- ---- All meetings with their host's name (JOIN) ----
SELECT m.id,
       m.meeting_code,
       m.title,
       m.meeting_type,
       m.status,
       m.scheduled_at,
       m.duration_minutes,
       u.name AS host
FROM meetings m
JOIN users u ON u.id = m.host_id
ORDER BY m.created_at DESC;

-- ---- Upcoming scheduled meetings (not ended), soonest first ----
SELECT meeting_code, title, scheduled_at, duration_minutes
FROM meetings
WHERE meeting_type = 'scheduled'
  AND status != 'ended'
ORDER BY scheduled_at ASC;

-- ---- Recent / past meetings ----
SELECT meeting_code, title, status, created_at, ended_at
FROM meetings
WHERE status = 'ended'
ORDER BY created_at DESC;

-- ---- Active participants in a given meeting (replace the code) ----
SELECT p.display_name, p.is_host, p.joined_at
FROM participants p
JOIN meetings m ON m.id = p.meeting_id
WHERE m.meeting_code = '812 3456 7890'
  AND p.left_at IS NULL;

-- ---- Chat history for a meeting ----
SELECT c.sender_name, c.content, c.created_at
FROM chat_messages c
JOIN meetings m ON m.id = c.meeting_id
WHERE m.meeting_code = '812 3456 7890'
ORDER BY c.created_at ASC;

-- ---- How many meetings each user hosts (GROUP BY) ----
SELECT u.name, COUNT(m.id) AS meetings_hosted
FROM users u
LEFT JOIN meetings m ON m.host_id = u.id
GROUP BY u.id
ORDER BY meetings_hosted DESC;

-- ---- Count meetings by status ----
SELECT status, COUNT(*) AS total
FROM meetings
GROUP BY status;
