import { systemPrompt } from './system-prompt.js';

export const saveSettings = async (settings) => {
    await chrome.storage.local.set(settings);
};

export const getSettings = async () => {
    return await chrome.storage.local.get(['apiKey', 'model', 'provider']);
};

export const improvePrompt = async (currentPrompt, settings) => {
    const { apiKey, provider, model } = settings;

    if (!apiKey) {
        throw new Error('API Key is missing.');
    }

    if (provider === 'openai') {
        return await callOpenAI(apiKey, model || 'gpt-4o', systemPrompt, currentPrompt);
    } else if (provider === 'gemini') {
        return await callGemini(apiKey, model || 'gemini-1.5-pro', systemPrompt, currentPrompt);
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
