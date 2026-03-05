import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_home_page(client):
    """Home page returns 200."""
    resp = client.get("/")
    assert resp.status_code == 200


def test_home_has_content(client):
    """Home page returns HTML content."""
    resp = client.get("/")
    assert len(resp.get_data(as_text=True)) > 0