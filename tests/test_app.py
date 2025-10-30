from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Make sure at least one known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    name = "CI Test Activity"
    # Create a temporary activity to avoid mutating real data
    app_module.activities[name] = {
        "description": "Temporary activity for tests",
        "schedule": "Now",
        "max_participants": 5,
        "participants": [],
    }

    email = "tester@ci.local"

    # Signup should succeed
    resp = client.post(f"/activities/{name}/signup?email={email}")
    assert resp.status_code == 200
    assert email in app_module.activities[name]["participants"]

    # Duplicate signup should fail with 400
    resp2 = client.post(f"/activities/{name}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister should succeed
    resp3 = client.delete(f"/activities/{name}/unregister?email={email}")
    assert resp3.status_code == 200
    assert email not in app_module.activities[name]["participants"]

    # Unregistering again should return 404
    resp4 = client.delete(f"/activities/{name}/unregister?email={email}")
    assert resp4.status_code == 404

    # Clean up
    del app_module.activities[name]


def test_signup_nonexistent_activity():
    resp = client.post("/activities/ThisActivityDoesNotExist/signup?email=a@b.com")
    assert resp.status_code == 404
