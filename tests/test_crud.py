import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_create_task(client):
    resp = client.post("/add", data={"title": "Buy milk"}, follow_redirects=True)

    assert resp.status_code == 200
    assert "Buy milk" in resp.get_data(as_text=True)


def test_update_task(client):
    client.post("/add", data={"title": "Old title"}, follow_redirects=True)

    task_id = 1

    resp = client.post(f"/update/{task_id}", data={"title": "New title"}, follow_redirects=True)

    assert resp.status_code == 200
    assert "New title" in resp.get_data(as_text=True)


def test_delete_task(client):
    client.post("/add", data={"title": "To be deleted"}, follow_redirects=True)

    task_id = 1

    resp = client.get(f"/delete/{task_id}", follow_redirects=True)

    assert resp.status_code == 200
    page = resp.get_data(as_text=True)

    assert "To be deleted" not in page
