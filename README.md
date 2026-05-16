# ✅ CC302 ToDo App

> A lightweight Flask task manager built for **CC302** — featuring full CRUD, automated CI/CD with GitHub Actions, Docker containerisation, and branch-protection quality gates.

---

## 📦 What's Inside

```
cc-302-to-do-app/
├── app.py                        # Flask application + all routes
├── Dockerfile                    # Container build instructions
├── requirements.txt              # Python dependencies
├── .flake8                       # Lint configuration
├── static/
│   ├── style.css                 # App styles
│   └── script.js                 # Frontend behaviour
├── templates/
│   └── index.html                # Main UI template
├── tests/
│   ├── __init__.py
│   ├── test_app.py               # Smoke tests
│   └── test_crud.py              # Full CRUD test suite
└── .github/
    └── workflows/
        ├── ci.yml                # Lint + test on every push / PR
        └── cd.yml                # Docker build + push on GitHub Release
```

---

## 🚀 Running the App Locally

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| pip | latest |
| Git | any |

### 1 — Clone the repo

```bash
git clone https://github.com/<your-username>/cc-302-to-do-app.git
cd cc-302-to-do-app
```

### 2 — Create a virtual environment (recommended)

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Start the development server

```bash
python app.py
```

Open your browser at **[http://localhost:5000](http://localhost:5000)** — the app is live. 🎉

> The server auto-reloads on file changes because `debug=True` is set in development mode.

---

## 🐳 Running with Docker

### Build the image

```bash
docker build -t todo-saas:latest .
```

### Run the container

```bash
docker run -p 5000:5000 todo-saas:latest
```

Then visit **[http://localhost:5000](http://localhost:5000)**.

### Using a versioned tag (SemVer)

```bash
# Build
docker build -t <dockerhub-user>/todo-saas:0.1.0 .

# Run a specific version
docker run -p 5000:5000 <dockerhub-user>/todo-saas:0.1.0
```

---

## 🔌 API Reference

All task data is stored **in-memory** — it resets when the server restarts.

| Method | Endpoint | Description | Body / Params |
|--------|----------|-------------|---------------|
| `GET` | `/` | Renders the main UI | — |
| `POST` | `/add` | Create a new task | form: `title` |
| `GET` | `/tasks` | List all tasks (JSON) | — |
| `POST` | `/update/<id>` | Update a task's title | form: `title` |
| `GET` | `/delete/<id>` | Delete a task by ID | — |

### Quick cURL examples

```bash
# Create a task
curl -X POST http://localhost:5000/add -d "title=Buy groceries"

# List all tasks
curl http://localhost:5000/tasks

# Update task with id=1
curl -X POST http://localhost:5000/update/1 -d "title=Buy groceries & cook dinner"

# Delete task with id=1
curl http://localhost:5000/delete/1
```

---

## 🧪 Running the Tests

```bash
# Run all tests with verbose output
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --cov=app

# Run a single test file
pytest tests/test_crud.py -v
```

A passing run looks like:

```
tests/test_crud.py::test_create_task   PASSED
tests/test_crud.py::test_update_task   PASSED
tests/test_crud.py::test_delete_task   PASSED
tests/test_app.py::test_app_import     PASSED
tests/test_app.py::test_app_responds   PASSED
```

### Lint check

```bash
flake8 . --count --max-line-length=120 --statistics
```

---

## 🌿 Git Branching Workflow

This project follows a structured branching model:

```
main          ← stable, production-ready
 └── dev      ← integration branch
      ├── feature/task-descriptions-and-metadata
      ├── feature/search-tasks
      └── feature/filters-and-sorting
```

**Rules enforced by branch protection:**
- No direct commits to `main` or `dev`
- Every feature ships via Pull Request
- CI must pass (green) before any PR can be merged

---

## ⚙️ GitHub Actions

### CI — runs on every push and PR

Defined in `.github/workflows/ci.yml`

Steps: **checkout → setup Python 3.11 → install deps → flake8 lint → pytest**

### CD — runs when a GitHub Release is published

Defined in `.github/workflows/cd.yml`

Steps: **checkout → Docker Buildx → login to DockerHub → extract version tag → build & push image**

Required GitHub Secrets:

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub access token (read/write) |

---

## 🏷️ Container Versioning (SemVer)

Images follow **MAJOR.MINOR.PATCH** semantic versioning:

| Version | When to bump |
|---------|-------------|
| PATCH (x.x.**1**) | Bug fixes only |
| MINOR (x.**1**.0) | New features added — this is the default for this assignment |
| MAJOR (**1**.0.0) | Breaking changes |

Current release: **`0.1.0`**

```bash
# Pull the latest release
docker pull <dockerhub-user>/todo-saas:0.1.0

# Or always-latest
docker pull <dockerhub-user>/todo-saas:latest
```

---

## 📋 Assignment Submission Checklist

- [x] `dev` branch created from `main`
- [x] 3 feature branches created from `dev`
- [x] Features implemented and merged into `dev` via PRs
- [x] `dev` merged into `main` via PR
- [x] Docker image built and pushed with `0.1.0` and `latest` tags
- [x] GitHub Release `v0.1.0` created with release notes
- [x] CI workflow passing on `main` and `dev`
- [x] CD workflow triggered on release publish
- [x] Branch protection rules enabled on `dev` and `main`
- [x] CRUD tests written with AAA structure (Create, Update, Delete)

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: flask` | Run `pip install -r requirements.txt` inside your venv |
| Port 5000 already in use | `lsof -i :5000` then kill the process, or change port in `app.py` |
| Docker `permission denied` | Prefix command with `sudo` or add your user to the `docker` group |
| CI fails on lint | Run `flake8 . --max-line-length=120` locally and fix flagged lines |
| CI fails on tests | Run `pytest tests/ -v` locally to see which assertion failed |
| CD doesn't trigger | Ensure you created a **Release** (not just a tag) and it was *published* |

---

## 📄 License

This project is submitted as coursework for **CC302**. All rights reserved by the student author.

---

*Built with Flask 🐍 · Containerised with Docker 🐳 · Automated with GitHub Actions ⚡*
