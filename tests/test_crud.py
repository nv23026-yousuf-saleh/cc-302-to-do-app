import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_create_task(client):
    # CREATE using form
    resp = client.post("/add", data={"title": "Buy milk"}, follow_redirects=True)
    assert resp.status_code == 200

    # READ/VERIFY
    assert "Buy milk" in resp.get_data(as_text=True)


def test_update_task(client):
    # CREATE first
    client.post("/add", data={"title": "Old title"}, follow_redirects=True)

    task_id = 1  # Update to match your actual task ID logic

    # UPDATE
    resp = client.post(f"/update/{task_id}", data={"title": "New title"}, follow_redirects=True)
    assert resp.status_code == 200

    # READ/VERIFY
    assert "New title" in resp.get_data(as_text=True)


def test_delete_task(client):
    # CREATE first
    client.post("/add", data={"title": "To be deleted"}, follow_redirects=True)

    task_id = 1  # Update to match your actual task ID logic

    # DELETE
    resp = client.get(f"/delete/{task_id}", follow_redirects=True)
    assert resp.status_code == 200

    # READ/VERIFY
    assert "To be deleted" not in resp.get_data(as_text=True)