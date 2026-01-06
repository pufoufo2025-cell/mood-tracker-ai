// Storage Management Module
class StorageManager {
    constructor(dbName = 'moodTrackerDB') {
        this.dbName = dbName;
        this.data = this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(this.dbName);
            return stored ? JSON.parse(stored) : this.getDefaultData();
        } catch (e) {
            console.error('Failed to load data:', e);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            entries: [],
            tasks: [],
            settings: {
                grokApiKey: '',
                language: 'zh-TW'
            }
        };
    }

    save() {
        try {
            localStorage.setItem(this.dbName, JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    }

    // Mood entries management
    addMoodEntry(mood, tags, note) {
        const entry = {
            id: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            mood: parseInt(mood),
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            note: note
        };
        this.data.entries.push(entry);
        this.save();
        return entry;
    }

    getMoodEntries(month = null) {
        if (!month) return this.data.entries;
        return this.data.entries.filter(entry => entry.date.startsWith(month));
    }

    // Tasks management
    addTask(title, description, urgent, important) {
        const task = {
            id: 'task-' + Date.now(),
            title,
            description,
            urgent: urgent === 'true' || urgent === true,
            important: important === 'true' || important === true,
            source: 'user',
            createdAt: new Date().toISOString()
        };
        this.data.tasks.push(task);
        this.save();
        return task;
    }

    updateTask(taskId, updates) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            this.save();
        }
        return task;
    }

    deleteTask(taskId) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
        this.save();
    }

    getTasks() {
        return this.data.tasks;
    }

    // Settings management
    setApiKey(key) {
        this.data.settings.grokApiKey = key;
        this.save();
    }

    getApiKey() {
        return this.data.settings.grokApiKey;
    }

    // Data import/export
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const parsed = JSON.parse(jsonData);
            if (parsed.entries && parsed.tasks && parsed.settings) {
                this.data = parsed;
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            this.data = this.getDefaultData();
            this.save();
            return true;
        }
        return false;
    }
}

const storage = new StorageManager();
