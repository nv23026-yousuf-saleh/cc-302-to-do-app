"""
CRUD tests for the ToDo Flask app.
Uses Option B style (form-based routes: /add, /update/<id>, /delete/<id>, /tasks).

Run with:  pytest -v tests/test_crud.py
"""

import pytest
import app as app_module          # import the module so we can reset state
from app import app


# ── Fixture ───────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_tasks():
    """Clear in-memory task store before every test so tests are independent."""
    app_module.tasks.clear()
    app_module.next_id = 1
    yield
    app_module.tasks.clear()
    app_module.next_id = 1


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ── Helper ────────────────────────────────────────────────────────────────────

def _task_list(client):
    """Return the JSON task list from GET /tasks."""
    resp = client.get("/tasks")
    assert resp.status_code == 200
    return resp.get_json()


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_create_task(client):
    """CREATE a task and verify it appears in the task list."""
    # ARRANGE – store starts empty
    assert _task_list(client) == []

    # ACT – post a new task
    resp = client.post("/add", data={"title": "Buy milk"}, follow_redirects=True)

    # ASSERT – redirect lands on /tasks (200) and task is present
    assert resp.status_code == 200
    tasks = _task_list(client)
    titles = [t["title"] for t in tasks]
    assert "Buy milk" in titles


def test_update_task(client):
    """CREATE a task, UPDATE its title, verify the change in the list."""
    # ARRANGE – create the task first
    client.post("/add", data={"title": "Old title"}, follow_redirects=True)
    tasks = _task_list(client)
    assert len(tasks) == 1
    task_id = tasks[0]["id"]

    # ACT – update the task's title
    resp = client.post(
        f"/update/{task_id}",
        data={"title": "New title"},
        follow_redirects=True,
    )

    # ASSERT – status 200, old title gone, new title present
    assert resp.status_code == 200
    updated_tasks = _task_list(client)
    titles = [t["title"] for t in updated_tasks]
    assert "New title" in titles
    assert "Old title" not in titles


def test_delete_task(client):
    """CREATE a task, DELETE it, verify it is gone from the list."""
    # ARRANGE – create the task first
    client.post("/add", data={"title": "To be deleted"}, follow_redirects=True)
    tasks = _task_list(client)
    assert len(tasks) == 1
    task_id = tasks[0]["id"]

    # ACT – delete the task
    resp = client.get(f"/delete/{task_id}", follow_redirects=True)

    # ASSERT – status 200, task no longer in list
    assert resp.status_code == 200
    remaining = _task_list(client)
    titles = [t["title"] for t in remaining]
    assert "To be deleted" not in titles
    assert len(remaining) == 0