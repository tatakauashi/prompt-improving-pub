/**
 * Language configuration and utilities for the extension
 */

/**
 * Supported languages with their display names
 */
export const SUPPORTED_LANGUAGES = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English'
    },
    ja: {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語'
    }
};

/**
 * Default language (fallback)
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Normalize language code from browser format to our format
 * Examples: 'ja-JP' -> 'ja', 'en-US' -> 'en', 'zh-CN' -> 'zh'
 * @param {string} langCode - Browser language code (e.g., 'ja-JP', 'en-US')
 * @returns {string} Normalized language code (e.g., 'ja', 'en')
 */
export function normalizeLanguageCode(langCode) {
    if (!langCode) return DEFAULT_LANGUAGE;

    // Extract the primary language code (before the hyphen)
    const primaryCode = langCode.toLowerCase().split('-')[0];

    // Check if we support this language
    if (SUPPORTED_LANGUAGES[primaryCode]) {
        return primaryCode;
    }

    // Fallback to default language if not supported
    return DEFAULT_LANGUAGE;
}

/**
 * Get browser language using Chrome extension API
 * @returns {string} Normalized language code
 */
export function getBrowserLanguage() {
    try {
        // Use Chrome extension API to get UI language
        const browserLang = chrome.i18n.getUILanguage();
        return normalizeLanguageCode(browserLang);
    } catch (error) {
        console.warn('Failed to get browser language:', error);
        return DEFAULT_LANGUAGE;
    }
}

/**
 * Import all language files
 */
import enTranslations from './en.json';
import jaTranslations from './ja.json';

export const translations = {
    en: enTranslations,
    ja: jaTranslations
};
