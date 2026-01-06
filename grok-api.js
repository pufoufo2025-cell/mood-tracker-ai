// Grok AI API Integration with Enhanced Eisenhower Matrix Support
class GrokAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.x.ai/v1/chat/completions';
  }

  // Enhanced prompt with Eisenhower Matrix examples and context
  buildEnhancedPrompt(tasks) {
    const eisenhowerExamples = [
      { title: 'Crisis Management', urgent: true, important: true, quadrant: 'Do Now (P1)' },
      { title: 'Strategic Planning', urgent: false, important: true, quadrant: 'Schedule (P2)' },
      { title: 'Urgent Emails', urgent: true, important: false, quadrant: 'Delegate (P3)' },
      { title: 'Social Media Browse', urgent: false, important: false, quadrant: 'Delete (P4)' }
    ];

    const taskSummary = tasks.map(t => `"${t.title}": ${t.description}`).join('\n');
    
    const prompt = `You are a professional task prioritization expert. Analyze the following tasks using the Eisenhower Matrix framework.

Eisenhower Matrix Overview:
- Quadrant 1 (Do Now): Urgent & Important - Crisis, deadlines, emergencies
- Quadrant 2 (Schedule): Not Urgent & Important - Strategic work, planning, skill development
- Quadrant 3 (Delegate): Urgent & Not Important - Interruptions, some meetings, some calls
- Quadrant 4 (Delete): Neither Urgent nor Important - Distractions, time wasters

Example Classifications:
${eisenhowerExamples.map(ex => `- "${ex.title}" -> ${ex.quadrant} (urgent: ${ex.urgent}, important: ${ex.important})`).join('\n')}

Tasks to Analyze:
${taskSummary}

For each task, determine:
1. Is it URGENT? (time-sensitive, has near deadline)
2. Is it IMPORTANT? (contributes to goals, has significant impact)

Provide the response ONLY as a valid JSON array with no markdown formatting.
Each object must have exactly these fields: id, title, urgent, important, quadrant
The quadrant field should be one of: "do_now", "schedule", "delegate", "delete"

Example output format:
[{"id":"task-1","title":"Task Title","urgent":true,"important":true,"quadrant":"do_now"},{"id":"task-2","title":"Task Title","urgent":false,"important":true,"quadrant":"schedule"}]`;
    
    return prompt;
  }

  async suggestPriorities(tasks) {
    if (!this.apiKey) {
      alert('Please set your Grok API key in settings');
      return null;
    }

    const prompt = this.buildEnhancedPrompt(tasks);

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
          temperature: 0.3  // Lower temperature for more consistent categorization
        })
      });

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON from response (handles potential markdown formatting)
      const jsonMatch = content.match(/\[.*\]/s);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate and normalize the response
        return parsed.map(item => ({
          id: item.id,
          title: item.title || 'Untitled',
          urgent: Boolean(item.urgent),
          important: Boolean(item.important),
          quadrant: item.quadrant || this.determineQuadrant(item.urgent, item.important),
          source: 'grok'
        }));
      }
      return null;
    } catch (error) {
      console.error('Grok API Error:', error);
      return null;
    }
  }

  // Fallback quadrant determination
  determineQuadrant(urgent, important) {
    if (urgent && important) return 'do_now';
    if (!urgent && important) return 'schedule';
    if (urgent && !important) return 'delegate';
    return 'delete';
  }
}

const grokAPI = storage.getApiKey() ? new GrokAPI(storage.getApiKey()) : null;
