/**
 * Utility functions for parsing and managing placeholders in structured prompts
 * 
 * Placeholder formats:
 * - With options: {{Label: [option1;; option2;; option3]}}
 * - Free input: {{Description}}
 */

/**
 * Extracts all placeholders from text
 * @param {string} text - The text containing placeholders
 * @returns {Array} Array of placeholder objects
 */
export function extractPlaceholders(text) {
    if (!text) return [];

    const placeholders = [];
    // Match {{...}} pattern
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
        const content = match[1].trim();
        const raw = match[0];

        // Check if it contains options (format: "Label: [option1;; option2;; option3]")
        const optionsMatch = content.match(/^(.+?):\s*\[(.+?)\]$/);

        let label, options;
        if (optionsMatch) {
            // Has predefined options
            label = optionsMatch[1].trim();
            options = optionsMatch[2]
                .split(';;')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
        } else {
            // Free-form input
            label = content;
            options = null;
        }

        placeholders.push({
            id: `placeholder-${index}`,
            raw: raw,
            label: label,
            options: options,
            value: '',
            isFilled: false
        });

        index++;
    }

    return placeholders;
}

/**
 * Replaces placeholders in text with provided values
 * @param {string} text - The text containing placeholders
 * @param {Object} values - Object mapping placeholder IDs to their values
 * @returns {string} Text with placeholders replaced
 */
export function replacePlaceholders(text, values) {
    if (!text) return text;

    let result = text;
    const placeholders = extractPlaceholders(text);

    placeholders.forEach(placeholder => {
        const value = values[placeholder.id];
        if (value) {
            result = result.replace(placeholder.raw, value);
        }
    });

    return result;
}

/**
 * Checks if all placeholders are filled
 * @param {Array} placeholders - Array of placeholder objects
 * @param {Object} values - Object mapping placeholder IDs to their values
 * @returns {boolean} True if all placeholders have values
 */
export function areAllPlaceholdersFilled(placeholders, values) {
    if (!placeholders || placeholders.length === 0) {
        return true; // No placeholders means nothing to fill
    }

    return placeholders.every(placeholder => {
        const value = values[placeholder.id];
        return value && value.trim().length > 0;
    });
}

/**
 * Updates placeholder filled status based on values
 * @param {Array} placeholders - Array of placeholder objects
 * @param {Object} values - Object mapping placeholder IDs to their values
 * @returns {Array} Updated placeholders with isFilled status
 */
export function updatePlaceholderStatus(placeholders, values) {
    return placeholders.map(placeholder => ({
        ...placeholder,
        value: values[placeholder.id] || '',
        isFilled: !!(values[placeholder.id] && values[placeholder.id].trim().length > 0)
    }));
}
