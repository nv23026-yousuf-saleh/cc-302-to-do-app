def test_app_import():
    from app import app
    assert app is not None


def test_home_status():
    from app import app
    app.config["TESTING"] = True

    with app.test_client() as client:
        response = client.get("/")

    assert response.status_code in [200, 302]

