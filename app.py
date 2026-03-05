from flask import Flask, render_template, request, redirect, url_for, jsonify

app = Flask(__name__)

# ── In-memory task store ──────────────────────────────────────────────────────
tasks = {}      # { id: {"id": int, "title": str} }
next_id = 1     # auto-increment counter


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/add", methods=["POST"])
def add_task():
    """Create a new task from a form POST (field: title)."""
    global next_id
    title = request.form.get("title", "").strip()
    if not title:
        return redirect(url_for("index"))
    tasks[next_id] = {"id": next_id, "title": title}
    next_id += 1
    return redirect(url_for("list_tasks"))


@app.route("/tasks", methods=["GET"])
def list_tasks():
    """Return all tasks as a JSON list."""
    return jsonify(list(tasks.values())), 200


@app.route("/update/<int:task_id>", methods=["POST"])
def update_task(task_id):
    """Update the title of an existing task."""
    if task_id not in tasks:
        return jsonify({"error": "Task not found"}), 404
    new_title = request.form.get("title", "").strip()
    if new_title:
        tasks[task_id]["title"] = new_title
    return redirect(url_for("list_tasks"))


@app.route("/delete/<int:task_id>", methods=["GET"])
def delete_task(task_id):
    """Delete a task by id."""
    tasks.pop(task_id, None)
    return redirect(url_for("list_tasks"))


# ── Dev server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)