// Global variables
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const prioritySelect = document.getElementById("prioritySelect");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const clearCompleted = document.getElementById("clearCompleted");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = 'all';

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('completionRate').textContent = rate + '%';
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Render tasks
function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'high') {
        filteredTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h5>No tasks found</h5>
                <p>Add a new task to get started</p>
            </div>
        `;
        updateCounter();
        updateStats();
        return;
    }

    filteredTasks.forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.className = `task ${task.completed ? 'completed' : ''} ${task.priority}-priority`;

        taskDiv.innerHTML = `
            <div class="task-checkbox" onclick="toggleComplete(${task.id})"></div>
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span><i class="bi bi-clock"></i> ${formatDate(task.createdAt)}</span>
                    <span class="priority-badge priority-${task.priority}">
                        ${task.priority}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-outline-warning" onclick="editTask(${task.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        taskList.appendChild(taskDiv);
    });

    updateCounter();
    updateStats();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add task
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        alert('Please enter a task');
        return;
    }

    const priority = prioritySelect.value;

    tasks.unshift({
        id: Date.now(),
        text: text,
        completed: false,
        priority: priority,
        createdAt: Date.now()
    });

    taskInput.value = "";
    saveTasks();
    renderTasks();
}

// Toggle complete
function toggleComplete(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );
    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Edit task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const newText = prompt("Edit task:", task.text);
    if (newText && newText.trim() !== "") {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

// Update counter
function updateCounter() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => 
            b.classList.remove('active')
        );
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTasks();
    });
});

// Clear completed
clearCompleted.addEventListener('click', function() {
    const completedCount = tasks.filter(task => task.completed).length;
    if (completedCount === 0) {
        alert('No completed tasks to clear');
        return;
    }
    if (confirm('Clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
});

// Add task button
addTaskBtn.addEventListener('click', addTask);

// Enter key to add task
taskInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        addTask();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
});