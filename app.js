// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initializeApp();
    renderUI();
});

function initializeApp() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Mood tracking
    document.getElementById('moodSlider').addEventListener('input', (e) => {
        updateMoodDisplay(e.target.value);
    });
    document.getElementById('saveMoodBtn').addEventListener('click', saveMood);

    // Task management
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('aiSuggestBtn').addEventListener('click', aiSuggestPriorities);

    // Matrix selection
    document.querySelectorAll('.matrix-btn').forEach(btn => {
        btn.addEventListener('click', selectMatrixQuadrant);
    });

    // Month picker
    const today = new Date().toISOString().split('T')[0].slice(0, 7);
    document.getElementById('reviewMonth').value = today;
    document.getElementById('reviewMonth').addEventListener('change', updateMonthlyReview);

    // Settings
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

function updateMoodDisplay(score) {
    const emojis = ['😭', '😥', '😐', '🙂', '🥰'];
    document.getElementById('moodScore').textContent = score;
    document.getElementById('moodEmoji').textContent = emojis[parseInt(score) - 1];
}

function saveMood() {
    const mood = document.getElementById('moodSlider').value;
    const tags = document.getElementById('moodTags').value;
    const note = document.getElementById('moodNote').value;

    storage.addMoodEntry(mood, tags, note);
    alert('Mood recorded successfully!');
    document.getElementById('moodTags').value = '';
    document.getElementById('moodNote').value = '';
    renderPastMoods();
}

function addTask() {
    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    const urgent = document.querySelector('.matrix-btn[data-urgent="true"].selected') ? true : false;
    const important = document.querySelector('.matrix-btn[data-important="true"].selected') ? true : false;

    if (!title) {
        alert('Please enter task title');
        return;
    }

    const priority = EisenhowerMatrix.calculatePriority(urgent, important);
    const task = storage.addTask(title, desc, urgent, important);
    alert('Task added!');
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    renderTasksMatrix();
}

function selectMatrixQuadrant(e) {
    document.querySelectorAll('.matrix-btn').forEach(btn => btn.classList.remove('selected'));
    e.target.closest('.matrix-btn').classList.add('selected');
}

async function aiSuggestPriorities() {
    const tasks = storage.getTasks();
    if (tasks.length === 0) {
        alert('No tasks to prioritize');
        return;
    }

    const apiKey = storage.getApiKey();
    if (!apiKey) {
        alert('Please set your Grok API key in settings');
        return;
    }

    const grok = new GrokAPI(apiKey);
    const suggestions = await grok.suggestPriorities(tasks);

    if (suggestions) {
        suggestions.forEach(suggestion => {
            storage.updateTask(suggestion.id, {
                urgent: suggestion.urgent,
                important: suggestion.important,
                source: 'ai'
            });
        });
        alert('Tasks prioritized by AI!');
        renderTasksMatrix();
    } else {
        alert('Failed to get AI suggestions');
    }
}

function updateMonthlyReview() {
    const month = document.getElementById('reviewMonth').value;
    const entries = storage.getMoodEntries(month);

    if (entries.length === 0) {
        document.getElementById('avgMood').textContent = '0.0';
        document.getElementById('maxMood').textContent = '0';
        document.getElementById('minMood').textContent = '0';
        document.getElementById('recordDays').textContent = '0';
        return;
    }

    const scores = entries.map(e => e.mood);
    const avg = (scores.reduce((a, b) => a + b) / scores.length).toFixed(1);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    document.getElementById('avgMood').textContent = avg;
    document.getElementById('maxMood').textContent = max;
    document.getElementById('minMood').textContent = min;
    document.getElementById('recordDays').textContent = entries.length;
}

function saveApiKey() {
    const key = document.getElementById('grokApiKey').value;
    storage.setApiKey(key);
    alert('API Key saved!');
}

function exportData() {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const success = storage.importData(event.target.result);
        if (success) {
            alert('Data imported successfully!');
            location.reload();
        } else {
            alert('Failed to import data. Invalid format.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (storage.clearAll()) {
        location.reload();
    }
}

function renderUI() {
    renderPastMoods();
    renderTasksMatrix();
    updateMonthlyReview();
}

function renderPastMoods() {
    const entries = storage.getMoodEntries().slice(-5).reverse();
    const html = entries.map(entry => `
        <div class="mood-item">
            <span class="mood-item-date">${entry.date}</span>
            <span class="mood-item-score">${EisenhowerMatrix.getMoodColor(entry.mood)}</span>
            ${entry.tags.length > 0 ? `<div class="mood-item-tags">${entry.tags.join(', ')}</div>` : ''}
        </div>
    `).join('');
    document.getElementById('pastMoodsList').innerHTML = html || '<p>No moods recorded yet</p>';
}

function renderTasksMatrix() {
    const tasks = storage.getTasks();
    const grouped = EisenhowerMatrix.groupTasksByQuadrant(tasks);

    Object.entries(grouped).forEach(([quadrant, quadrantTasks]) => {
        const html = quadrantTasks.map(task => `
            <div class="task-item">
                <span class="task-item-title">${task.title}</span>
                <button class="task-item-btn" onclick="deleteTask('${task.id}')">Delete</button>
            </div>
        `).join('');
        document.getElementById(quadrant).innerHTML = html || '<p style="color:#999;">No tasks</p>';
    });
}

function deleteTask(taskId) {
    storage.deleteTask(taskId);
    renderTasksMatrix();
}
