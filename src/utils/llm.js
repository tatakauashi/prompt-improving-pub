import { getSystemPrompt } from './system-prompt.js';

export const saveSettings = async (settings) => {
    await chrome.storage.local.set(settings);
};

export const getSettings = async () => {
    return await chrome.storage.local.get(['apiKey', 'provider', 'openaiModel', 'geminiModel', 'claudeModel', 'xaiModel', 'explanationStyle']);
};

export const improvePrompt = async (currentPrompt, settings, files = []) => {
    const { apiKey, provider, model, explanationStyle } = settings;

    if (!apiKey) {
        throw new Error('API Key is missing.');
    }

    const systemPrompt = getSystemPrompt(explanationStyle || 'beginnerFriendly');

    if (provider === 'openai') {
        return await callOpenAI(apiKey, model || 'gpt-5-mini', systemPrompt, currentPrompt, files);
    } else if (provider === 'gemini') {
        return await callGemini(apiKey, model || 'gemini-2.5-pro', systemPrompt, currentPrompt, files);
    } else if (provider === 'claude') {
        return await callClaude(apiKey, model || 'claude-sonnet-4-5', systemPrompt, currentPrompt, files);
    } else if (provider === 'xai') {
        return await callXAI(apiKey, model || 'grok-4-0709', systemPrompt, currentPrompt, files);
    } else {
        throw new Error('Invalid provider selected.');
    }
};

async function callOpenAI(apiKey, model, systemPrompt, userPrompt, files = []) {
    // 添付がある場合は Responses API を使う（PDF: input_file / 画像: input_image / テキスト: input_text）
    if (files && files.length > 0) {
        const { images, pdfs, textFiles, otherFiles } = splitFiles(files);

        if (otherFiles.length > 0) {
            const names = otherFiles.map(f => f.name).join(', ');
            throw new Error(`Unsupported file type(s): ${names}`);
        }

        // text files -> read and embed into input_text
        const embeddedTexts = await Promise.all(textFiles.map(readTextFileForPrompt));

        // PDFs -> upload -> input_file
        const uploadedPdfs = await Promise.all(pdfs.map((f) => uploadOpenAIFile(apiKey, f)));

        // images -> data URL -> input_image
        const imageDataUrls = await Promise.all(images.map(fileToDataUrl));

        const userContent = [
            ...uploadedPdfs.map((u) => ({ type: 'input_file', file_id: u.id })),
            ...imageDataUrls.map((dataUrl) => ({ type: 'input_image', image_url: dataUrl })),
            ...(embeddedTexts.length > 0 ? [{
                type: 'input_text',
                text: [
                    'Attached text files:',
                    embeddedTexts.join("\n\n"),
                    '',
                    'User Prompt:',
                    userPrompt
                ].join("\n")
            }] : [{ type: 'input_text', text: userPrompt }])
        ];

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                input: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                text: { format: { type: 'json_object' } }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || 'OpenAI Responses API Error');
        }

        const data = await response.json();
        const text = extractResponsesOutputText(data);

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Failed to parse AI response as JSON.');
        }
    }

    // 添付なしなら今まで通り Chat Completions
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

// --- helpers for OpenAI Responses w/ files ---

function splitFiles(files) {
    const images = [];
    const pdfs = [];
    const textFiles = [];
    const otherFiles = [];

    for (const f of files) {
        const name = (f?.name || '').toLowerCase();
        const type = f?.type || '';

        if (type.startsWith('image/')) {
            images.push(f);
        } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
            pdfs.push(f);
        } else if (
            type.startsWith('text/') ||
            name.endsWith('.txt') ||
            name.endsWith('.md') ||
            name.endsWith('.csv') ||
            name.endsWith('.json')
        ) {
            textFiles.push(f);
        } else {
            otherFiles.push(f);
        }
    }

    return { images, pdfs, textFiles, otherFiles };
}

async function readTextFileForPrompt(file) {
    const text = await file.text();
    // でかすぎるとコスト＆失敗率が上がるので軽く上限を設ける（必要なら調整）
    const MAX_CHARS = 200_000;
    const clipped = text.length > MAX_CHARS ? (text.slice(0, MAX_CHARS) + "\n\n    [...truncated]") : text;

    return [
        `--- file: ${file.name} ---`,
        clipped
    ].join("\n");
}

async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

async function uploadOpenAIFile(apiKey, file) {
    // browser File expected
    if (!(file instanceof File)) {
        throw new Error('Invalid file object. Expected a browser File.');
    }

    const form = new FormData();
    form.append('purpose', 'user_data');
    form.append('file', file, file.name);

    const res = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: form
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'OpenAI Files API Error');
    }

    return await res.json();
}

function extractResponsesOutputText(responseJson) {
    const output = responseJson?.output;
    if (!Array.isArray(output)) return '';

    const chunks = [];
    for (const item of output) {
        if (item?.type !== 'message') continue;
        if (!Array.isArray(item.content)) continue;

        for (const part of item.content) {
            if (part?.type === 'output_text' && typeof part.text === 'string') {
                chunks.push(part.text);
            }
        }
    }
    return chunks.join('');
}


async function callGemini(apiKey, model, systemPrompt, userPrompt, files = []) {
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

async function callClaude(apiKey, model, systemPrompt, userPrompt, files = []) {
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

async function callXAI(apiKey, model, systemPrompt, userPrompt, files = []) {
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
