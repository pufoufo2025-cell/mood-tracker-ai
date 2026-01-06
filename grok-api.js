// Grok AI API Integration
class GrokAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.x.ai/v1/chat/completions';
    }

    async suggestPriorities(tasks) {
        if (!this.apiKey) {
            alert('Please set your Grok API key in settings');
            return null;
        }

        const taskSummary = tasks.map(t => `"${t.title}": ${t.description}`).join('\n');
        const prompt = `You are a time management expert. Analyze these tasks and assign Eisenhower matrix priorities (urgent: true/false, important: true/false).

Tasks:
${taskSummary}

Return as JSON array with fields: id, urgent, important. Example: [{"id":"task-1","urgent":true,"important":true}]`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-4-latest',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                console.error('API Error:', response.status);
                return null;
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\[.*\]/s);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (error) {
            console.error('Grok API Error:', error);
            return null;
        }
    }
}

const grokAPI = storage.getApiKey() ? new GrokAPI(storage.getApiKey()) : null;
