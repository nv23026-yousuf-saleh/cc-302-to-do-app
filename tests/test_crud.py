import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_create_task(client):
    resp = client.post("/tasks", json={"title": "Buy milk"})
    assert resp.status_code in (200, 201)

    resp2 = client.get("/tasks")
    assert resp2.status_code == 200
    assert "Buy milk" in resp2.get_data(as_text=True)


def test_update_task(client):
    create = client.post("/tasks", json={"title": "Old title"})
    assert create.status_code in (200, 201)

    task_id = 1

    update = client.put(f"/tasks/{task_id}", json={"title": "New title"})
    assert update.status_code in (200, 204)

    resp2 = client.get("/tasks")
    assert "New title" in resp2.get_data(as_text=True)


def test_delete_task(client):
    create = client.post("/tasks", json={"title": "To be deleted"})
    assert create.status_code in (200, 201)

    task_id = 1

    delete = client.delete(f"/tasks/{task_id}")
    assert delete.status_code in (200, 204)

    resp2 = client.get("/tasks")
    assert "To be deleted" not in resp2.get_data(as_text=True)