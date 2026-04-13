import pytest
import app as app_module
from app import app


@pytest.fixture(autouse=True)
def reset_tasks():
    """Reset in-memory store before every test."""
    app_module.tasks.clear()
    app_module.next_id = 1
    yield


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ── Create ────────────────────────────────────────────────────────────────────

def test_create_task_basic(client):
    """AAA: Create a task with title only — defaults applied."""
    # Act
    client.post("/add", data={"title": "Buy groceries"})
    resp = client.get("/tasks")

    # Assert
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Buy groceries"
    assert data[0]["status"] == "pending"
    assert data[0]["priority"] == "medium"
    assert data[0]["description"] == ""


def test_create_task_with_metadata(client):
    """AAA: Create a task with all metadata fields."""
    # Act
    client.post("/add", data={
        "title": "Write report",
        "description": "End of year summary",
        "priority": "high",
        "due_date": "2025-06-01",
        "status": "in-progress"
    })
    resp = client.get("/tasks")

    # Assert
    data = resp.get_json()
    assert data[0]["description"] == "End of year summary"
    assert data[0]["priority"] == "high"
    assert data[0]["due_date"] == "2025-06-01"
    assert data[0]["status"] == "in-progress"


def test_create_task_invalid_priority_defaults_to_medium(client):
    """AAA: Invalid priority value falls back to medium."""
    # Act
    client.post("/add", data={"title": "Test task", "priority": "urgent"})
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json()[0]["priority"] == "medium"


def test_create_task_empty_title_not_saved(client):
    """AAA: Empty title should not create a task."""
    # Act
    client.post("/add", data={"title": "   "})
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json() == []


# ── Update ────────────────────────────────────────────────────────────────────

def test_update_task_title(client):
    """AAA: Update a task title."""
    # Arrange
    client.post("/add", data={"title": "Old title"})

    # Act
    client.post("/update/1", data={"title": "New title"})
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json()[0]["title"] == "New title"


def test_update_task_status(client):
    """AAA: Update a task status to done."""
    # Arrange
    client.post("/add", data={"title": "Finish homework"})

    # Act
    client.post("/update/1", data={"status": "done"})
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json()[0]["status"] == "done"


def test_update_task_description(client):
    """AAA: Update a task description."""
    # Arrange
    client.post("/add", data={"title": "Task with desc"})

    # Act
    client.post("/update/1", data={"description": "Updated description"})
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json()[0]["description"] == "Updated description"


def test_update_task_not_found_returns_404(client):
    """AAA: Updating a non-existent task returns 404."""
    # Act
    resp = client.post("/update/999", data={"title": "Ghost"})

    # Assert
    assert resp.status_code == 404


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_task(client):
    """AAA: Delete a task removes it from the list."""
    # Arrange
    client.post("/add", data={"title": "To be deleted"})

    # Act
    client.get("/delete/1")
    resp = client.get("/tasks")

    # Assert
    assert resp.get_json() == []


def test_delete_nonexistent_task_does_not_crash(client):
    """AAA: Deleting a non-existent task returns 200/302 without crashing."""
    # Act
    resp = client.get("/delete/999")

    # Assert
    assert resp.status_code in [200, 302]
