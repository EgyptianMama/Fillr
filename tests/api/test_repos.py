from fastapi.testclient import TestClient

from repolens.api.main import create_app


def test_submit_repository_creates_job() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/repos",
        json={"url": "https://github.com/example/project.git", "branch": "main"},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["repo_id"]
    assert payload["job_id"]
    assert payload["status_url"] == f"/jobs/{payload['job_id']}"
    assert payload["repository"]["status"] == "queued"
    assert payload["job"]["status"] == "queued"


def test_get_job_after_submission() -> None:
    client = TestClient(create_app())
    created = client.post("/repos", json={"url": "https://github.com/example/project.git"})

    job_id = created.json()["job_id"]
    response = client.get(f"/jobs/{job_id}")

    assert response.status_code == 200
    assert response.json()["id"] == job_id


def test_rejects_invalid_repository_url() -> None:
    client = TestClient(create_app())

    response = client.post("/repos", json={"url": "not-a-url"})

    assert response.status_code == 422
