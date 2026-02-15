// ========================================
// GLOBAL VARIABLES & INITIALIZATION
// ========================================

const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskContainer = document.getElementById('taskContainer');
const timelineView = document.getElementById('timelineView');
const timelineItems = document.getElementById('timelineItems');
const clearCompleted = document.getElementById('clearCompleted');
const celebrationOverlay = document.getElementById('celebrationOverlay');
const themeToggle = document.getElementById('themeToggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentView = 'today';
let userData = JSON.parse(localStorage.getItem('userData')) || {
    xp: 0,
    streak: 0,
    lastActive: null,
    completedToday: 0
};

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update button label
    const themeLabel = themeToggle.querySelector('.theme-label');
    if (theme === 'dark') {
        themeLabel.textContent = 'Light Mode';
    } else {
        themeLabel.textContent = 'Dark Mode';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ========================================
// GAMIFICATION SYSTEM
// ========================================

function updateUserData() {
    const today = new Date().toDateString();
    const lastActive = userData.lastActive;

    // Check streak
    if (lastActive) {
        const lastDate = new Date(lastActive);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
            // Continue streak
        } else if (lastDate.toDateString() !== today) {
            // Reset streak if missed a day
            userData.streak = 0;
        }
    }

    // Reset daily counter
    if (lastActive !== today) {
        userData.completedToday = 0;
    }

    userData.lastActive = today;
    saveUserData();
    updateStatsDisplay();
}

function addXP(amount) {
    userData.xp += amount;
    saveUserData();
    updateStatsDisplay();
}

function incrementStreak() {
    const today = new Date().toDateString();
    if (userData.lastActive !== today && userData.completedToday === 0) {
        userData.streak += 1;
        saveUserData();
        updateStatsDisplay();
    }
}

function saveUserData() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

function updateStatsDisplay() {
    document.getElementById('streakCount').textContent = userData.streak;
    document.getElementById('xpPoints').textContent = userData.xp + ' XP';
    document.getElementById('completedToday').textContent = userData.completedToday + ' completed today';
    
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
}

function showCelebration(message, xp) {
    document.getElementById('celebrationMessage').textContent = message;
    document.getElementById('xpEarned').textContent = '+' + xp + ' XP';
    celebrationOverlay.classList.add('show');
    
    setTimeout(() => {
        celebrationOverlay.classList.remove('show');
    }, 2000);
}

// ========================================
// TASK MANAGEMENT FUNCTIONS
// ========================================

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const priority = prioritySelect.value;
    const suggestedPriority = autoSuggestPriority(text);
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: suggestedPriority || priority,
        createdAt: Date.now(),
        completedAt: null
    };

    tasks.unshift(task);
    taskInput.value = '';
    saveTasks();
    renderTasks();
    
    // Show feedback animation
    const firstTask = document.querySelector('.task-item');
    if (firstTask) {
        firstTask.style.animation = 'none';
        setTimeout(() => {
            firstTask.style.animation = 'slideIn 0.3s ease';
        }, 10);
    }
}

function autoSuggestPriority(text) {
    const lowerText = text.toLowerCase();
    
    // High priority keywords
    const urgentWords = ['urgent', 'asap', 'critical', 'important', 'deadline', 'emergency'];
    if (urgentWords.some(word => lowerText.includes(word))) {
        return 'high';
    }
    
    // Low priority keywords
    const lowWords = ['maybe', 'sometime', 'eventually', 'consider', 'idea'];
    if (lowWords.some(word => lowerText.includes(word))) {
        return 'low';
    }
    
    return null; // Use selected priority
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    if (task.completed) {
        // Gamification rewards
        const xpAmount = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5;
        addXP(xpAmount);
        userData.completedToday += 1;
        
        if (userData.completedToday === 1) {
            incrementStreak();
        }
        
        saveUserData();
        updateStatsDisplay();
        
        // Show celebration for first completion or high priority tasks
        if (userData.completedToday === 1 || task.priority === 'high') {
            showCelebration('Great job! Keep it up!', xpAmount);
        }
    } else {
        userData.completedToday = Math.max(0, userData.completedToday - 1);
        saveUserData();
        updateStatsDisplay();
    }

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

// ========================================
// TASK ROLLOVER SYSTEM
// ========================================

function rolloverUncompletedTasks() {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    tasks = tasks.map(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        
        // If task is from yesterday and not completed, update createdAt to today
        if (taskDate === yesterdayStr && !task.completed) {
            return { ...task, createdAt: Date.now(), rolledOver: true };
        }
        return task;
    });

    saveTasks();
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderTasks() {
    let filteredTasks = getFilteredTasks();

    if (currentView === 'timeline') {
        renderTimelineView(filteredTasks);
        taskContainer.style.display = 'none';
        timelineView.style.display = 'block';
        document.getElementById('filterSection').style.display = 'none';
        return;
    } else {
        taskContainer.style.display = 'block';
        timelineView.style.display = 'none';
        document.getElementById('filterSection').style.display = 'flex';
    }

    if (currentView === 'today') {
        const today = new Date().toDateString();
        filteredTasks = filteredTasks.filter(t => {
            const taskDate = new Date(t.createdAt).toDateString();
            return taskDate === today;
        });
    }

    taskContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
        taskContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-inbox"></i>
                </div>
                <h4>${getEmptyMessage()}</h4>
                <p>Add a new task to get started</p>
            </div>
        `;
    } else {
        filteredTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            taskContainer.appendChild(taskEl);
        });
    }

    updateFilterCounts();
    updateTaskSummary();
}

function getFilteredTasks() {
    let filtered = tasks;

    switch (currentFilter) {
        case 'active':
            filtered = tasks.filter(t => !t.completed);
            break;
        case 'completed':
            filtered = tasks.filter(t => t.completed);
            break;
        case 'high':
            filtered = tasks.filter(t => t.priority === 'high' && !t.completed);
            break;
    }

    return filtered;
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;

    const timeStr = formatTime(task.createdAt);

    taskDiv.innerHTML = `
        <div class="task-content-row">
            <div class="task-checkbox" onclick="toggleComplete(${task.id})"></div>
            <div class="task-text-area">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <div class="task-time">
                        <i class="bi bi-clock"></i>
                        ${timeStr}
                    </div>
                    <div class="priority-tag ${task.priority}">${task.priority}</div>
                    ${task.rolledOver ? '<span class="badge bg-info">Rolled Over</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit" onclick="editTask(${task.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="action-btn delete" onclick="deleteTask(${task.id})">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        </div>
    `;

    return taskDiv;
}

function renderTimelineView(filteredTasks) {
    timelineItems.innerHTML = '';

    if (filteredTasks.length === 0) {
        timelineItems.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-clock-history"></i>
                </div>
                <h4>No timeline yet</h4>
                <p>Your tasks will appear here with timestamps</p>
            </div>
        `;
        return;
    }

    // Sort by creation time
    const sortedTasks = [...filteredTasks].sort((a, b) => b.createdAt - a.createdAt);

    sortedTasks.forEach(task => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';

        const timeStr = formatFullTime(task.createdAt);

        timelineItem.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-time">${timeStr}</div>
            ${createTaskElement(task).outerHTML}
        `;

        timelineItems.appendChild(timelineItem);
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function formatFullTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getEmptyMessage() {
    switch (currentFilter) {
        case 'active':
            return 'No active tasks';
        case 'completed':
            return 'No completed tasks yet';
        case 'high':
            return 'No urgent tasks';
        default:
            return currentView === 'today' ? "You're all set for today!" : 'No tasks yet';
    }
}

function updateFilterCounts() {
    const allCount = tasks.length;
    const activeCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;

    document.getElementById('countAll').textContent = allCount;
    document.getElementById('countActive').textContent = activeCount;
    document.getElementById('countCompleted').textContent = completedCount;
}

function updateTaskSummary() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    let summary = '';
    if (total === 0) {
        summary = 'No tasks yet';
    } else if (active === 0) {
        summary = '🎉 All tasks completed!';
    } else {
        summary = `${active} task${active !== 1 ? 's' : ''} remaining`;
    }

    document.getElementById('taskSummary').textContent = summary;
}

// ========================================
// EVENT LISTENERS
// ========================================

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Add task on Enter
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Filter buttons
document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTasks();
    });
});

// View switcher
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentView = this.dataset.view;
        
        const titles = {
            'today': "Today's Tasks",
            'timeline': 'Task Timeline',
            'all': 'All Tasks'
        };
        
        document.getElementById('viewTitle').textContent = titles[currentView];
        renderTasks();
    });
});

// Clear completed
clearCompleted.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        alert('No completed tasks to clear');
        return;
    }

    if (confirm(`Clear ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    }
});

// Close celebration on click
celebrationOverlay.addEventListener('click', () => {
    celebrationOverlay.classList.remove('show');
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme(); // Initialize theme first
    updateUserData();
    rolloverUncompletedTasks();
    renderTasks();
});