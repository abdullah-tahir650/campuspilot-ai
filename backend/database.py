
import sqlite3
from pathlib import Path

# Store the database in the main campuspilot-ai folder.
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "campuspilot.db"


def get_connection():
    """Open a connection to the SQLite database."""
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the tasks table if it doesn't exist."""
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                due_date TEXT DEFAULT '',
                completed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def create_task(title, description="", due_date=""):
    """Save a new student task and return it."""
    title = title.strip()

    if not title:
        raise ValueError("Task title cannot be empty.")

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO tasks (title, description, due_date)
            VALUES (?, ?, ?)
            """,
            (title, description, due_date),
        )

        task_id = cursor.lastrowid

        task = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

        return dict(task)


def list_tasks(include_completed=True):
    """Return saved tasks, newest first."""
    with get_connection() as connection:
        if include_completed:
            rows = connection.execute(
                "SELECT * FROM tasks ORDER BY id DESC"
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM tasks WHERE completed = 0 ORDER BY id DESC"
            ).fetchall()

        return [dict(row) for row in rows]


def complete_task(task_id):
    """Mark a task complete. Return None if it doesn't exist."""
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET completed = 1 WHERE id = ?",
            (task_id,),
        )

        if cursor.rowcount == 0:
            return None

        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

        return dict(row)


def delete_task(task_id):
    """Delete a task. Return True if deleted, otherwise False."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,),
        )

        return cursor.rowcount > 0


def reopen_task(task_id):
    """Mark a completed task as pending. Return None if missing."""
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET completed = 0 WHERE id = ?",
            (task_id,),
        )

        if cursor.rowcount == 0:
            return None

        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

        return dict(row)
