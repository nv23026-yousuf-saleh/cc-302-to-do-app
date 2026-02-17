// ========================================
// GLOBAL VARIABLES & INITIALIZATION
// ========================================

const taskInput = document.getElementById('taskInput');
const deadlineInput = document.getElementById('deadlineInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskContainer = document.getElementById('taskContainer');
const timelineView = document.getElementById('timelineView');
const timelineItems = document.getElementById('timelineItems');
const calendarView = document.getElementById('calendarView');
const clearCompleted = document.getElementById('clearCompleted');
const celebrationOverlay = document.getElementById('celebrationOverlay');
const themeToggle = document.getElementById('themeToggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentView = 'today';
let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let userData = JSON.parse(localStorage.getItem('userData')) || {
    xp: 0,
    streak: 0,
    lastActive: null,
    completedToday: 0
};

// Search state
let searchQuery = '';
let searchPriorityFilter = 'all';

// Pomodoro state
let pomodoroState = {
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
    timeRemaining: 25 * 60, // seconds
    totalTime: 25 * 60,
    currentSession: 0,
    completedSessions: 0,
    selectedTaskId: null,
    timerInterval: null
};

let pomodoroSettings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    soundEnabled: true
};

let pomodoroStats = JSON.parse(localStorage.getItem('pomodoroStats')) || {
    todayPomodoros: 0,
    totalPomodoros: 0,
    totalMinutes: 0,
    lastDate: null
};

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
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

    if (lastActive) {
        const lastDate = new Date(lastActive);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
            // Continue streak
        } else if (lastDate.toDateString() !== today) {
            userData.streak = 0;
        }
    }

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
    
    const parsedDeadline = parseDeadlineFromText(text);
    const manualDeadline = deadlineInput.value ? new Date(deadlineInput.value).getTime() : null;
    const deadline = manualDeadline || parsedDeadline;
    
    let cleanedText = text;
    if (parsedDeadline && !manualDeadline) {
        cleanedText = removeDeadlineFromText(text);
    }
    
    const task = {
        id: Date.now(),
        text: cleanedText,
        completed: false,
        priority: suggestedPriority || priority,
        createdAt: Date.now(),
        completedAt: null,
        deadline: deadline
    };

    tasks.unshift(task);
    taskInput.value = '';
    deadlineInput.value = '';
    saveTasks();
    renderTasks();
    
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
    
    const urgentWords = ['urgent', 'asap', 'critical', 'important', 'deadline', 'emergency'];
    if (urgentWords.some(word => lowerText.includes(word))) {
        return 'high';
    }
    
    const lowWords = ['maybe', 'sometime', 'eventually', 'consider', 'idea'];
    if (lowWords.some(word => lowerText.includes(word))) {
        return 'low';
    }
    
    return null;
}

// ========================================
// DEADLINE PARSING FUNCTIONS
// ========================================

function parseDeadlineFromText(text) {
    const lowerText = text.toLowerCase();
    const now = new Date();
    
    if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        return tomorrow.getTime();
    }
    
    if (lowerText.includes('today')) {
        const today = new Date(now);
        today.setHours(23, 59, 59, 999);
        return today.getTime();
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
        if (lowerText.includes(days[i])) {
            const targetDay = i;
            const currentDay = now.getDay();
            let daysUntilTarget = targetDay - currentDay;
            if (daysUntilTarget <= 0) daysUntilTarget += 7;
            
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + daysUntilTarget);
            targetDate.setHours(23, 59, 59, 999);
            return targetDate.getTime();
        }
    }
    
    const inDaysMatch = lowerText.match(/in (\d+) days?/);
    if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1]);
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(23, 59, 59, 999);
        return targetDate.getTime();
    }
    
    const inWeeksMatch = lowerText.match(/in (\d+) weeks?/);
    if (inWeeksMatch) {
        const weeks = parseInt(inWeeksMatch[1]);
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + (weeks * 7));
        targetDate.setHours(23, 59, 59, 999);
        return targetDate.getTime();
    }
    
    const datePatterns = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
        /(\d{1,2})\/(\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            let year, month, day;
            if (pattern.source.includes('\\d{4}')) {
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            } else if (match[3]) {
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
                if (year < 100) year += 2000;
            } else {
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = now.getFullYear();
                const testDate = new Date(year, month, day);
                if (testDate < now) year++;
            }
            
            const targetDate = new Date(year, month, day, 23, 59, 59, 999);
            if (!isNaN(targetDate.getTime())) {
                return targetDate.getTime();
            }
        }
    }
    
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                    'july', 'august', 'september', 'october', 'november', 'december'];
    for (let i = 0; i < months.length; i++) {
        const monthPattern = new RegExp(months[i] + '\\s+(\\d{1,2})', 'i');
        const match = text.match(monthPattern);
        if (match) {
            const day = parseInt(match[1]);
            let year = now.getFullYear();
            const testDate = new Date(year, i, day);
            if (testDate < now) year++;
            
            const targetDate = new Date(year, i, day, 23, 59, 59, 999);
            return targetDate.getTime();
        }
    }
    
    return null;
}

function removeDeadlineFromText(text) {
    let cleaned = text;
    cleaned = cleaned.replace(/\s*(by|due|until|deadline)\s+[a-zA-Z0-9\/\-\s]+/gi, '');
    cleaned = cleaned.replace(/\s*(tomorrow|today)/gi, '');
    cleaned = cleaned.replace(/\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/gi, '');
    cleaned = cleaned.replace(/\s*in\s+\d+\s+(days?|weeks?)/gi, '');
    cleaned = cleaned.replace(/\s*\d{4}-\d{1,2}-\d{1,2}/g, '');
    cleaned = cleaned.replace(/\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, '');
    return cleaned.trim();
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    if (task.completed) {
        const xpAmount = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5;
        addXP(xpAmount);
        userData.completedToday += 1;
        
        if (userData.completedToday === 1) {
            incrementStreak();
        }
        
        saveUserData();
        updateStatsDisplay();
        
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
    
    // Re-render search if in search view
    if (currentView === 'search') {
        renderSearchResults();
    }
}

function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    
    if (currentView === 'search') {
        renderSearchResults();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
        
        if (currentView === 'search') {
            renderSearchResults();
        }
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
        if (taskDate === yesterdayStr && !task.completed) {
            return { ...task, createdAt: Date.now(), rolledOver: true };
        }
        return task;
    });

    saveTasks();
}

// ========================================
// SEARCH FEATURE
// ========================================

function renderSearchView() {
    // Show search view, hide others
    document.getElementById('searchView').style.display = 'block';
    taskContainer.style.display = 'none';
    timelineView.style.display = 'none';
    calendarView.style.display = 'none';
    document.getElementById('focusView').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';

    // Focus the search input
    setTimeout(() => {
        document.getElementById('searchInput').focus();
    }, 100);

    renderSearchResults();
}

function renderSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    const resultsInfo = document.getElementById('searchResultsInfo');

    let filtered = tasks;

    // Filter by search query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(t => t.text.toLowerCase().includes(query));
    }

    // Filter by priority
    if (searchPriorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === searchPriorityFilter);
    }

    resultsContainer.innerHTML = '';

    // Update results info
    if (searchQuery.trim()) {
        resultsInfo.textContent = `Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"`;
    } else {
        resultsInfo.textContent = `Showing all ${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="empty-icon">
                    <i class="bi bi-search"></i>
                </div>
                <h4>${searchQuery ? 'No tasks found' : 'No tasks yet'}</h4>
                <p>${searchQuery ? `No tasks match "${searchQuery}"` : 'Add some tasks to get started'}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(task => {
        const taskEl = createTaskElementWithHighlight(task, searchQuery);
        resultsContainer.appendChild(taskEl);
    });
}

function createTaskElementWithHighlight(task, query) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;

    const timeStr = formatTime(task.createdAt);
    const deadlineBadge = task.deadline ? getDeadlineBadge(task.deadline, task.completed) : '';

    // Highlight matching text
    let displayText = escapeHtml(task.text);
    if (query && query.trim()) {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        displayText = displayText.replace(regex, '<span class="search-highlight">$1</span>');
    }

    taskDiv.innerHTML = `
        <div class="task-content-row">
            <div class="task-checkbox" onclick="toggleComplete(${task.id})"></div>
            <div class="task-text-area">
                <div class="task-text">${displayText}</div>
                <div class="task-meta">
                    <div class="task-time">
                        <i class="bi bi-clock"></i>
                        ${timeStr}
                    </div>
                    <div class="priority-tag ${task.priority}">${task.priority}</div>
                    ${task.rolledOver ? '<span class="badge bg-info">Rolled Over</span>' : ''}
                    ${deadlineBadge}
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

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderTasks() {
    let filteredTasks = getFilteredTasks();

    if (currentView === 'search') {
        renderSearchView();
        return;
    } else if (currentView === 'focus') {
        renderFocusView();
        taskContainer.style.display = 'none';
        timelineView.style.display = 'none';
        calendarView.style.display = 'none';
        document.getElementById('focusView').style.display = 'block';
        document.getElementById('filterSection').style.display = 'none';
        document.getElementById('searchView').style.display = 'none';
        return;
    } else if (currentView === 'calendar') {
        renderCalendarView();
        taskContainer.style.display = 'none';
        timelineView.style.display = 'none';
        calendarView.style.display = 'block';
        document.getElementById('focusView').style.display = 'none';
        document.getElementById('filterSection').style.display = 'none';
        document.getElementById('searchView').style.display = 'none';
        return;
    } else if (currentView === 'timeline') {
        renderTimelineView(filteredTasks);
        taskContainer.style.display = 'none';
        timelineView.style.display = 'block';
        calendarView.style.display = 'none';
        document.getElementById('focusView').style.display = 'none';
        document.getElementById('filterSection').style.display = 'none';
        document.getElementById('searchView').style.display = 'none';
        return;
    } else {
        taskContainer.style.display = 'block';
        timelineView.style.display = 'none';
        calendarView.style.display = 'none';
        document.getElementById('focusView').style.display = 'none';
        document.getElementById('filterSection').style.display = 'flex';
        document.getElementById('searchView').style.display = 'none';
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
    const deadlineBadge = task.deadline ? getDeadlineBadge(task.deadline, task.completed) : '';

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
                    ${deadlineBadge}
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
// CALENDAR VIEW FUNCTIONS
// ========================================

function renderCalendarView() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    const todayStr = today.toDateString();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createCalendarDay(day, year, month - 1, true);
        calendarDays.appendChild(dayEl);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createCalendarDay(day, year, month, false);
        const dateStr = new Date(year, month, day).toDateString();
        
        if (dateStr === todayStr) {
            dayEl.classList.add('today');
        }
        
        if (selectedCalendarDate && dateStr === selectedCalendarDate.toDateString()) {
            dayEl.classList.add('selected');
        }
        
        calendarDays.appendChild(dayEl);
    }
    
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createCalendarDay(day, year, month + 1, true);
        calendarDays.appendChild(dayEl);
    }
    
    if (selectedCalendarDate) {
        renderSelectedDateTasks();
    } else {
        document.getElementById('selectedDateTasks').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-calendar-check"></i></div>
                <h4>Select a date</h4>
                <p>Click on a calendar date to view tasks</p>
            </div>
        `;
    }
}

function createCalendarDay(day, year, month, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');
    
    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    
    const tasksOnDate = tasks.filter(t => {
        if (!t.deadline) return false;
        const taskDeadline = new Date(t.deadline);
        return taskDeadline.toDateString() === dateStr;
    });
    
    if (tasksOnDate.length > 0 && !isOtherMonth) {
        dayEl.classList.add('has-tasks');
    }
    
    dayEl.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        ${tasksOnDate.length > 0 ? `
            <div class="calendar-day-indicators">
                ${tasksOnDate.slice(0, 3).map(t => 
                    `<div class="calendar-indicator-dot ${t.priority}"></div>`
                ).join('')}
            </div>
            <div class="calendar-day-tasks">${tasksOnDate[0].text}</div>
        ` : ''}
    `;
    
    dayEl.addEventListener('click', () => {
        if (!isOtherMonth) {
            selectedCalendarDate = date;
            renderCalendarView();
        }
    });
    
    return dayEl;
}

function renderSelectedDateTasks() {
    const selectedDateTasksEl = document.getElementById('selectedDateTasks');
    const dateStr = selectedCalendarDate.toDateString();
    
    const tasksOnDate = tasks.filter(t => {
        if (!t.deadline) return false;
        const taskDeadline = new Date(t.deadline);
        return taskDeadline.toDateString() === dateStr;
    });
    
    const dateFormatted = selectedCalendarDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    selectedDateTasksEl.innerHTML = `
        <div class="selected-date-header">
            <i class="bi bi-calendar-check"></i> ${dateFormatted}
            <span style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">
                (${tasksOnDate.length} task${tasksOnDate.length !== 1 ? 's' : ''})
            </span>
        </div>
        <div class="task-container">
            ${tasksOnDate.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon"><i class="bi bi-inbox"></i></div>
                    <h4>No tasks due</h4>
                    <p>No tasks scheduled for this date</p>
                </div>
            ` : ''}
        </div>
    `;
    
    const container = selectedDateTasksEl.querySelector('.task-container');
    tasksOnDate.forEach(task => {
        const taskEl = createTaskElement(task);
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }
        container.appendChild(taskEl);
    });
}

function getDeadlineBadge(deadline, isCompleted) {
    if (isCompleted) return '';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let badgeClass = 'deadline-badge';
    let icon = 'bi-calendar-event';
    let text = '';
    
    if (diffDays < 0) {
        badgeClass += ' overdue';
        icon = 'bi-exclamation-triangle-fill';
        text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
        badgeClass += ' urgent';
        icon = 'bi-alarm-fill';
        text = 'Due today!';
    } else if (diffDays === 1) {
        badgeClass += ' urgent';
        icon = 'bi-alarm';
        text = 'Due tomorrow';
    } else if (diffDays <= 3) {
        badgeClass += ' urgent';
        icon = 'bi-calendar-week';
        text = `Due in ${diffDays} days`;
    } else if (diffDays <= 7) {
        badgeClass += ' upcoming';
        icon = 'bi-calendar-check';
        text = `Due in ${diffDays} days`;
    } else {
        badgeClass += ' upcoming';
        icon = 'bi-calendar';
        text = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return `<div class="${badgeClass}"><i class="${icon}"></i> ${text}</div>`;
}

// ========================================
// POMODORO FOCUS MODE FUNCTIONS
// ========================================

function renderFocusView() {
    updatePomodoroStats();
    populateFocusTaskDropdown();
    updateTimerDisplay();
    updateSessionDots();
}

function populateFocusTaskDropdown() {
    const dropdown = document.getElementById('focusTaskSelect');
    const activeTasks = tasks.filter(t => !t.completed);
    
    dropdown.innerHTML = '<option value="">Select a task...</option>';
    activeTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.text;
        dropdown.appendChild(option);
    });
    
    if (pomodoroState.selectedTaskId) {
        dropdown.value = pomodoroState.selectedTaskId;
        updateFocusTaskDisplay();
    }
}

function updateFocusTaskDisplay() {
    const dropdown = document.getElementById('focusTaskSelect');
    const display = document.getElementById('focusTaskDisplay');
    const selectedTaskId = parseInt(dropdown.value);
    
    pomodoroState.selectedTaskId = selectedTaskId || null;
    
    if (selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (task) {
            display.innerHTML = `
                <i class="bi bi-check-circle-fill"></i>
                <span>${task.text}</span>
            `;
        }
    } else {
        display.innerHTML = `
            <i class="bi bi-check-circle"></i>
            <span>No task selected</span>
        `;
    }
}

function startPomodoro() {
    if (!pomodoroState.selectedTaskId) {
        alert('Please select a task to focus on!');
        return;
    }
    
    pomodoroState.isRunning = true;
    pomodoroState.isPaused = false;
    
    if (pomodoroState.timeRemaining === pomodoroState.totalTime) {
        if (pomodoroState.currentMode === 'work') {
            pomodoroState.currentSession++;
        }
    }
    
    updateControlButtons();
    updateSessionDots();
    
    pomodoroState.timerInterval = setInterval(() => {
        if (!pomodoroState.isPaused) {
            pomodoroState.timeRemaining--;
            updateTimerDisplay();
            updateTimerRing();
            updateBrowserTab();
            
            if (pomodoroState.timeRemaining <= 0) {
                completeSession();
            }
        }
    }, 1000);
}

function pausePomodoro() {
    pomodoroState.isPaused = true;
    updateControlButtons();
}

function resumePomodoro() {
    pomodoroState.isPaused = false;
    updateControlButtons();
}

function stopPomodoro() {
    if (!confirm('Stop the current session? Progress will be lost.')) return;
    
    clearInterval(pomodoroState.timerInterval);
    resetPomodoroState();
    updateTimerDisplay();
    updateTimerRing();
    updateControlButtons();
    updateSessionDots();
    updateBrowserTab();
}

function skipSession() {
    if (!confirm('Skip to the next session?')) return;
    
    clearInterval(pomodoroState.timerInterval);
    completeSession();
}

function completeSession() {
    clearInterval(pomodoroState.timerInterval);
    
    if (pomodoroSettings.soundEnabled) {
        playNotificationSound();
    }
    
    if (pomodoroState.currentMode === 'work') {
        const xpAmount = 5;
        addXP(xpAmount);
        pomodoroState.completedSessions++;
        
        updatePomodoroStatsData();
        
        showCelebration('🍅 Focus session complete!', xpAmount);
    }
    
    if (pomodoroState.currentMode === 'work') {
        if (pomodoroState.currentSession % 4 === 0) {
            switchToMode('longBreak');
        } else {
            switchToMode('shortBreak');
        }
    } else {
        switchToMode('work');
    }
}

function switchToMode(mode) {
    pomodoroState.currentMode = mode;
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    
    if (mode === 'work') {
        pomodoroState.timeRemaining = pomodoroSettings.workDuration * 60;
        pomodoroState.totalTime = pomodoroSettings.workDuration * 60;
    } else if (mode === 'shortBreak') {
        pomodoroState.timeRemaining = pomodoroSettings.shortBreak * 60;
        pomodoroState.totalTime = pomodoroSettings.shortBreak * 60;
    } else if (mode === 'longBreak') {
        pomodoroState.timeRemaining = pomodoroSettings.longBreak * 60;
        pomodoroState.totalTime = pomodoroSettings.longBreak * 60;
    }
    
    updateTimerDisplay();
    updateTimerRing();
    updateControlButtons();
    updateSessionDots();
    updateBrowserTab();
}

function resetPomodoroState() {
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    pomodoroState.currentMode = 'work';
    pomodoroState.timeRemaining = pomodoroSettings.workDuration * 60;
    pomodoroState.totalTime = pomodoroSettings.workDuration * 60;
}

function updateTimerDisplay() {
    const minutes = Math.floor(pomodoroState.timeRemaining / 60);
    const seconds = pomodoroState.timeRemaining % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerDisplay').textContent = timeStr;
    
    const modeText = pomodoroState.currentMode === 'work' ? 'WORK SESSION' :
                     pomodoroState.currentMode === 'shortBreak' ? 'SHORT BREAK' :
                     'LONG BREAK';
    document.getElementById('timerMode').textContent = modeText;
}

function updateTimerRing() {
    const ring = document.getElementById('timerRingProgress');
    const circumference = 2 * Math.PI * 90;
    const progress = pomodoroState.timeRemaining / pomodoroState.totalTime;
    const offset = circumference * (1 - progress);
    
    ring.style.strokeDashoffset = offset;
    
    if (pomodoroState.currentMode !== 'work') {
        ring.classList.add('break-mode');
    } else {
        ring.classList.remove('break-mode');
    }
}

function updateControlButtons() {
    const startBtn = document.getElementById('startPomodoroBtn');
    const pauseBtn = document.getElementById('pausePomodoroBtn');
    const resumeBtn = document.getElementById('resumePomodoroBtn');
    const skipBtn = document.getElementById('skipPomodoroBtn');
    const stopBtn = document.getElementById('stopPomodoroBtn');
    
    if (!pomodoroState.isRunning) {
        startBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        stopBtn.style.display = 'none';
    } else if (pomodoroState.isPaused) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'flex';
        skipBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
    } else {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        resumeBtn.style.display = 'none';
        skipBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
    }
}

function updateSessionDots() {
    const dots = document.querySelectorAll('.session-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('completed', 'active');
        if (index < pomodoroState.completedSessions % 4) {
            dot.classList.add('completed');
        } else if (index === pomodoroState.currentSession - 1 && pomodoroState.isRunning) {
            dot.classList.add('active');
        }
    });
    
    const sessionNum = ((pomodoroState.currentSession - 1) % 4) + 1;
    document.getElementById('sessionCount').textContent = `Session ${sessionNum}/4`;
}

function updateBrowserTab() {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) {
        const minutes = Math.floor(pomodoroState.timeRemaining / 60);
        const seconds = pomodoroState.timeRemaining % 60;
        document.title = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')} - FlowTask`;
    } else {
        document.title = 'FlowTask - Smart Task Management';
    }
}

function playNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function updatePomodoroStatsData() {
    const today = new Date().toDateString();
    
    if (pomodoroStats.lastDate !== today) {
        pomodoroStats.todayPomodoros = 0;
        pomodoroStats.lastDate = today;
    }
    
    pomodoroStats.todayPomodoros++;
    pomodoroStats.totalPomodoros++;
    pomodoroStats.totalMinutes += pomodoroSettings.workDuration;
    
    localStorage.setItem('pomodoroStats', JSON.stringify(pomodoroStats));
    updatePomodoroStats();
}

function updatePomodoroStats() {
    const today = new Date().toDateString();
    if (pomodoroStats.lastDate !== today) {
        pomodoroStats.todayPomodoros = 0;
        pomodoroStats.lastDate = today;
        localStorage.setItem('pomodoroStats', JSON.stringify(pomodoroStats));
    }
    
    document.getElementById('todayPomodoros').textContent = pomodoroStats.todayPomodoros;
    document.getElementById('completedPomodoros').textContent = pomodoroStats.totalPomodoros;
    
    const hours = Math.floor(pomodoroStats.totalMinutes / 60);
    const minutes = pomodoroStats.totalMinutes % 60;
    document.getElementById('totalFocusTime').textContent = `${hours}h ${minutes}m`;
}

function savePomodoroSettings() {
    pomodoroSettings.workDuration = parseInt(document.getElementById('workDuration').value);
    pomodoroSettings.shortBreak = parseInt(document.getElementById('shortBreak').value);
    pomodoroSettings.longBreak = parseInt(document.getElementById('longBreak').value);
    pomodoroSettings.soundEnabled = document.getElementById('soundEnabled').checked;
    
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    
    if (!pomodoroState.isRunning) {
        resetPomodoroState();
        updateTimerDisplay();
        updateTimerRing();
    }
}

function loadPomodoroSettings() {
    document.getElementById('workDuration').value = pomodoroSettings.workDuration;
    document.getElementById('shortBreak').value = pomodoroSettings.shortBreak;
    document.getElementById('longBreak').value = pomodoroSettings.longBreak;
    document.getElementById('soundEnabled').checked = pomodoroSettings.soundEnabled;
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
            'focus': 'Focus Mode',
            'calendar': 'Calendar View',
            'timeline': 'Task Timeline',
            'all': 'All Tasks',
            'search': 'Search Tasks'
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

// Calendar navigation
document.getElementById('prevMonth')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendarView();
});

document.getElementById('nextMonth')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendarView();
});

// ========================================
// SEARCH EVENT LISTENERS
// ========================================

document.getElementById('searchInput')?.addEventListener('input', function() {
    searchQuery = this.value;
    const clearBtn = document.getElementById('clearSearchBtn');
    clearBtn.style.display = searchQuery ? 'flex' : 'none';
    renderSearchResults();
});

document.getElementById('clearSearchBtn')?.addEventListener('click', function() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    searchQuery = '';
    this.style.display = 'none';
    searchInput.focus();
    renderSearchResults();
});

document.querySelectorAll('.search-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.search-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        searchPriorityFilter = this.dataset.priority;
        renderSearchResults();
    });
});

// Pomodoro Focus Mode event listeners
document.getElementById('focusTaskSelect')?.addEventListener('change', updateFocusTaskDisplay);
document.getElementById('startPomodoroBtn')?.addEventListener('click', startPomodoro);
document.getElementById('pausePomodoroBtn')?.addEventListener('click', pausePomodoro);
document.getElementById('resumePomodoroBtn')?.addEventListener('click', resumePomodoro);
document.getElementById('stopPomodoroBtn')?.addEventListener('click', stopPomodoro);
document.getElementById('skipPomodoroBtn')?.addEventListener('click', skipSession);

document.getElementById('focusSettingsBtn')?.addEventListener('click', () => {
    const panel = document.getElementById('focusSettingsPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        loadPomodoroSettings();
    } else {
        panel.style.display = 'none';
    }
});

document.getElementById('workDuration')?.addEventListener('change', savePomodoroSettings);
document.getElementById('shortBreak')?.addEventListener('change', savePomodoroSettings);
document.getElementById('longBreak')?.addEventListener('change', savePomodoroSettings);
document.getElementById('soundEnabled')?.addEventListener('change', savePomodoroSettings);

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateUserData();
    rolloverUncompletedTasks();
    loadPomodoroSettings();
    updatePomodoroStats();
    renderTasks();
});

window.addEventListener('beforeunload', () => {
    if (pomodoroState.timerInterval) {
        clearInterval(pomodoroState.timerInterval);
    }
});