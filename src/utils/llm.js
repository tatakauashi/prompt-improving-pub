import { getSystemPrompt } from './system-prompt.js';

export const saveSettings = async (settings) => {
    await chrome.storage.local.set(settings);
};

export const getSettings = async () => {
    return await chrome.storage.local.get(['apiKey', 'provider', 'openaiModel', 'geminiModel', 'claudeModel', 'xaiModel', 'explanationStyle']);
};

export const improvePrompt = async (currentPrompt, settings) => {
    const { apiKey, provider, model, explanationStyle } = settings;

    if (!apiKey) {
        throw new Error('API Key is missing.');
    }

    const systemPrompt = getSystemPrompt(explanationStyle || 'beginnerFriendly');

    if (provider === 'openai') {
        return await callOpenAI(apiKey, model || 'gpt-5-mini', systemPrompt, currentPrompt);
    } else if (provider === 'gemini') {
        return await callGemini(apiKey, model || 'gemini-2.5-pro', systemPrompt, currentPrompt);
    } else if (provider === 'claude') {
        return await callClaude(apiKey, model || 'claude-sonnet-4-5', systemPrompt, currentPrompt);
    } else if (provider === 'xai') {
        return await callXAI(apiKey, model || 'grok-4-0709', systemPrompt, currentPrompt);
    } else {
        throw new Error('Invalid provider selected.');
    }
};

async function callOpenAI(apiKey, model, systemPrompt, userPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'OpenAI API Error');
    }

    const data = await response.json();
    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        throw new Error('Failed to parse AI response as JSON.');
    }
}

async function callGemini(apiKey, model, systemPrompt, userPrompt) {
    // Gemini API (Google AI Studio)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: systemPrompt + "\n\nUser Prompt:\n" + userPrompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    try {
        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
        throw new Error('Failed to parse AI response as JSON.');
    }
}

async function callClaude(apiKey, model, systemPrompt, userPrompt) {
    // Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': true
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Claude API Error');
    }

    const data = await response.json();
    try {
        // Claude returns content in data.content[0].text
        const responseText = data.content[0].text;
        if (responseText.startsWith('```json') && responseText.endsWith('```')) {
            return JSON.parse(responseText.slice(7, -3));
        }
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error('Failed to parse AI response as JSON.');
    }
}

async function callXAI(apiKey, model, systemPrompt, userPrompt) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'xAI API Error');
    }

    const data = await response.json();
    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        throw new Error('Failed to parse AI response as JSON.');
    }
}
