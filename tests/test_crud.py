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
    client.post("/add", data={"title": "Buy groceries"})
    data = client.get("/tasks").get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Buy groceries"
    assert data[0]["status"] == "pending"
    assert data[0]["priority"] == "medium"
    assert data[0]["description"] == ""


def test_create_task_with_metadata(client):
    """AAA: Create a task with all metadata fields."""
    client.post("/add", data={
        "title": "Write report",
        "description": "End of year summary",
        "priority": "high",
        "due_date": "2025-06-01",
        "status": "in-progress"
    })
    data = client.get("/tasks").get_json()
    assert data[0]["description"] == "End of year summary"
    assert data[0]["priority"] == "high"
    assert data[0]["due_date"] == "2025-06-01"
    assert data[0]["status"] == "in-progress"


def test_create_task_invalid_priority_defaults_to_medium(client):
    """AAA: Invalid priority value falls back to medium."""
    client.post("/add", data={"title": "Test task", "priority": "urgent"})
    assert client.get("/tasks").get_json()[0]["priority"] == "medium"


def test_create_task_empty_title_not_saved(client):
    """AAA: Empty title should not create a task."""
    client.post("/add", data={"title": "   "})
    assert client.get("/tasks").get_json() == []


# ── Update ────────────────────────────────────────────────────────────────────

def test_update_task_title(client):
    """AAA: Update a task title."""
    client.post("/add", data={"title": "Old title"})
    client.post("/update/1", data={"title": "New title"})
    assert client.get("/tasks").get_json()[0]["title"] == "New title"


def test_update_task_status(client):
    """AAA: Update a task status to done."""
    client.post("/add", data={"title": "Finish homework"})
    client.post("/update/1", data={"status": "done"})
    assert client.get("/tasks").get_json()[0]["status"] == "done"


def test_update_task_description(client):
    """AAA: Update a task description."""
    client.post("/add", data={"title": "Task with desc"})
    client.post("/update/1", data={"description": "Updated description"})
    assert client.get("/tasks").get_json()[0]["description"] == "Updated description"


def test_update_task_not_found_returns_404(client):
    """AAA: Updating a non-existent task returns 404."""
    resp = client.post("/update/999", data={"title": "Ghost"})
    assert resp.status_code == 404


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_task(client):
    """AAA: Delete a task removes it from the list."""
    client.post("/add", data={"title": "To be deleted"})
    client.get("/delete/1")
    assert client.get("/tasks").get_json() == []


def test_delete_nonexistent_task_does_not_crash(client):
    """AAA: Deleting a non-existent task returns 200/302 without crashing."""
    resp = client.get("/delete/999")
    assert resp.status_code in [200, 302]


# ── Search ────────────────────────────────────────────────────────────────────

def test_search_by_title(client):
    """AAA: Search returns tasks matching title."""
    client.post("/add", data={"title": "Buy groceries", "description": ""})
    client.post("/add", data={"title": "Write report", "description": ""})
    data = client.get("/tasks/search?q=groceries").get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Buy groceries"


def test_search_by_description(client):
    """AAA: Search returns tasks matching description."""
    client.post("/add", data={"title": "Task A", "description": "meeting notes"})
    client.post("/add", data={"title": "Task B", "description": "shopping list"})
    data = client.get("/tasks/search?q=meeting").get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Task A"


def test_search_case_insensitive(client):
    """AAA: Search is case-insensitive."""
    client.post("/add", data={"title": "Buy Groceries", "description": ""})
    assert len(client.get("/tasks/search?q=groceries").get_json()) == 1


def test_search_no_query_returns_all(client):
    """AAA: Empty search query returns all tasks."""
    client.post("/add", data={"title": "Task 1"})
    client.post("/add", data={"title": "Task 2"})
    assert len(client.get("/tasks/search?q=").get_json()) == 2


def test_search_no_match_returns_empty(client):
    """AAA: Search with no matching results returns empty list."""
    client.post("/add", data={"title": "Buy groceries"})
    assert client.get("/tasks/search?q=xyz123").get_json() == []


# ── Stats ────────────────────────────────────────────────────────────────────

def test_stats_empty(client):
    """AAA: Stats with no tasks returns all zeros."""
    # Act
    resp = client.get("/stats")

    # Assert
    data = resp.get_json()
    assert data["total"] == 0
    assert data["completed"] == 0
    assert data["pending"] == 0
    assert data["overdue"] == 0


def test_stats_total_and_pending(client):
    """AAA: Stats correctly counts total and pending tasks."""
    # Arrange
    client.post("/add", data={"title": "Task 1"})
    client.post("/add", data={"title": "Task 2"})

    # Act
    data = client.get("/stats").get_json()

    # Assert
    assert data["total"] == 2
    assert data["pending"] == 2
    assert data["completed"] == 0


def test_stats_completed(client):
    """AAA: Stats correctly counts completed tasks."""
    # Arrange
    client.post("/add", data={"title": "Task 1"})
    client.post("/update/1", data={"status": "done"})

    # Act
    data = client.get("/stats").get_json()

    # Assert
    assert data["completed"] == 1
    assert data["pending"] == 0


def test_stats_overdue(client):
    """AAA: Stats correctly counts overdue tasks."""
    # Arrange — due date in the past
    client.post("/add", data={"title": "Old task", "due_date": "2020-01-01"})

    # Act
    data = client.get("/stats").get_json()

    # Assert
    assert data["overdue"] == 1


def test_stats_overdue_excludes_completed(client):
    """AAA: Completed tasks with past due date are not counted as overdue."""
    # Arrange
    client.post("/add", data={"title": "Old done task", "due_date": "2020-01-01"})
    client.post("/update/1", data={"status": "done"})

    # Act
    data = client.get("/stats").get_json()

    # Assert
    assert data["overdue"] == 0

