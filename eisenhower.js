// Eisenhower Matrix Logic
class EisenhowerMatrix {
    static calculatePriority(urgent, important) {
        if (urgent && important) return 'do_now';
        if (!urgent && important) return 'schedule';
        if (urgent && !important) return 'delegate';
        return 'delete';
    }

    static groupTasksByQuadrant(tasks) {
        return {
            do_now: tasks.filter(t => t.urgent && t.important),
            schedule: tasks.filter(t => !t.urgent && t.important),
            delegate: tasks.filter(t => t.urgent && !t.important),
            delete: tasks.filter(t => !t.urgent && !t.important)
        };
    }

    static getMoodColor(score) {
        const moods = {
            1: '\ud83d\ude2d',
            2: '\ud83d\ude25',
            3: '\ud83d\ude10',
            4: '\ud83d\ude42',
            5: '\ud83e\udd70'
        };
        return moods[score] || '\ud83d\ude10';
    }
}

const eisenhower = EisenhowerMatrix;
