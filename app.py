from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime

app = Flask(__name__)

# ── In-memory task store ──────────────────────────────────────────────────────
tasks = {}      # { id: { task fields } }
next_id = 1     # auto-increment counter

VALID_PRIORITIES = {"low", "medium", "high"}
VALID_STATUSES = {"pending", "in-progress", "done"}


def make_task(task_id, title, description="", priority="medium",
              due_date=None, status="pending"):
    """Return a new task dict with all metadata fields."""
    now = datetime.utcnow().isoformat()
    return {
        "id": task_id,
        "title": title,
        "description": description,
        "priority": priority,
        "due_date": due_date,
        "status": status,
        "created_at": now,
        "updated_at": now,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/add", methods=["POST"])
def add_task():
    """Create a new task from a form POST."""
    global next_id
    title = request.form.get("title", "").strip()
    if not title:
        return redirect(url_for("index"))

    description = request.form.get("description", "").strip()
    priority = request.form.get("priority", "medium").strip().lower()
    due_date = request.form.get("due_date", "").strip() or None
    status = request.form.get("status", "pending").strip().lower()

    if priority not in VALID_PRIORITIES:
        priority = "medium"
    if status not in VALID_STATUSES:
        status = "pending"

    tasks[next_id] = make_task(next_id, title, description,
                               priority, due_date, status)
    next_id += 1
    return redirect(url_for("list_tasks"))


@app.route("/tasks", methods=["GET"])
def list_tasks():
    """Return all tasks as a JSON list."""
    return jsonify(list(tasks.values())), 200


@app.route("/update/<int:task_id>", methods=["POST"])
def update_task(task_id):
    """Update fields of an existing task."""
    if task_id not in tasks:
        return jsonify({"error": "Task not found"}), 404

    task = tasks[task_id]

    new_title = request.form.get("title", "").strip()
    if new_title:
        task["title"] = new_title

    new_desc = request.form.get("description", None)
    if new_desc is not None:
        task["description"] = new_desc.strip()

    new_priority = request.form.get("priority", "").strip().lower()
    if new_priority in VALID_PRIORITIES:
        task["priority"] = new_priority

    new_due = request.form.get("due_date", "").strip()
    if new_due:
        task["due_date"] = new_due

    new_status = request.form.get("status", "").strip().lower()
    if new_status in VALID_STATUSES:
        task["status"] = new_status

    task["updated_at"] = datetime.utcnow().isoformat()
    return redirect(url_for("list_tasks"))


@app.route("/delete/<int:task_id>", methods=["GET"])
def delete_task(task_id):
    """Delete a task by id."""
    tasks.pop(task_id, None)
    return redirect(url_for("list_tasks"))


# ── Dev server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)