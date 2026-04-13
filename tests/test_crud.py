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
    client.post("/add", data={
        "title": "Write report",
        "description": "End of year summary",
        "priority": "high",
        "due_date": "2025-06-01",
        "status": "in-progress"
    })
    resp = client.get("/tasks")
    data = resp.get_json()
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
    # Arrange
    client.post("/add", data={"title": "Buy groceries", "description": ""})
    client.post("/add", data={"title": "Write report", "description": ""})

    # Act
    resp = client.get("/tasks/search?q=groceries")

    # Assert
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Buy groceries"


def test_search_by_description(client):
    """AAA: Search returns tasks matching description."""
    # Arrange
    client.post("/add", data={"title": "Task A", "description": "meeting notes"})
    client.post("/add", data={"title": "Task B", "description": "shopping list"})

    # Act
    resp = client.get("/tasks/search?q=meeting")

    # Assert
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Task A"


def test_search_case_insensitive(client):
    """AAA: Search is case-insensitive."""
    # Arrange
    client.post("/add", data={"title": "Buy Groceries", "description": ""})

    # Act
    resp = client.get("/tasks/search?q=groceries")

    # Assert
    assert len(resp.get_json()) == 1


def test_search_no_query_returns_all(client):
    """AAA: Empty search query returns all tasks."""
    # Arrange
    client.post("/add", data={"title": "Task 1"})
    client.post("/add", data={"title": "Task 2"})

    # Act
    resp = client.get("/tasks/search?q=")

    # Assert
    assert len(resp.get_json()) == 2


def test_search_no_match_returns_empty(client):
    """AAA: Search with no matching results returns empty list."""
    # Arrange
    client.post("/add", data={"title": "Buy groceries"})

    # Act
    resp = client.get("/tasks/search?q=xyz123")

    # Assert
    assert resp.get_json() == []


def test_home_page(client):
    """Home page returns 200."""
    resp = client.get("/")
    assert resp.status_code == 200
