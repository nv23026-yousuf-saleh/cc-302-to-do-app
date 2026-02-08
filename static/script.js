const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const clearCompleted = document.getElementById("clearCompleted");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = "";

    let filtered = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    filtered.forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task";
        if (task.completed) taskDiv.classList.add("completed");

        const span = document.createElement("span");
        span.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "actions";

        const completeBtn = document.createElement("button");
        completeBtn.className = "btn btn-sm btn-success";
        completeBtn.textContent = "Complete";
        completeBtn.onclick = () => toggleComplete(task.id);

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-warning";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => editTask(task.id);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteTask(task.id);

        actions.append(completeBtn, editBtn, deleteBtn);
        taskDiv.append(span, actions);
        taskList.appendChild(taskDiv);
    });

    updateCounter();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({
        id: Date.now(),
        text,
        completed: false
    });

    taskInput.value = "";
    saveTasks();
    renderTasks();
}

function toggleComplete(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const newText = prompt("Edit task:", task.text);
    if (newText !== null && newText.trim() !== "") {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

function updateCounter() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${remaining} tasks remaining`;
}

clearCompleted.onclick = () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
};

addTaskBtn.onclick = addTask;

taskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addTask();
});

document.querySelectorAll(".filters button").forEach(btn => {
    btn.onclick = () => {
        currentFilter = btn.dataset.filter;
        renderTasks();
    };
});

renderTasks();
