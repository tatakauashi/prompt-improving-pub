import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    getBrowserLanguage,
    translations
} from '../locales';

const LanguageContext = createContext();

/**
 * Replace placeholders in translation strings
 * Example: "Hello, {{name}}!" with {name: "Alice"} => "Hello, Alice!"
 * @param {string} text - Translation string with placeholders
 * @param {Object} params - Parameters to substitute
 * @returns {string} Text with placeholders replaced
 */
function replacePlaceholders(text, params = {}) {
    if (!text || !params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
    });
}

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
    const [isLoading, setIsLoading] = useState(true);

    // Load language preference on mount
    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const loadLanguagePreference = async () => {
        try {
            // Try to load saved language preference
            const result = await chrome.storage.local.get(['language']);

            if (result.language && SUPPORTED_LANGUAGES[result.language]) {
                // User has a saved preference
                setCurrentLanguage(result.language);
            } else {
                // No saved preference - auto-detect browser language
                const browserLang = getBrowserLanguage();
                setCurrentLanguage(browserLang);
                // Save the detected language
                await chrome.storage.local.set({ language: browserLang });
            }
        } catch (error) {
            console.error('Failed to load language preference:', error);
            setCurrentLanguage(DEFAULT_LANGUAGE);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Change the current language
     * @param {string} newLanguage - Language code (e.g., 'en', 'ja')
     */
    const changeLanguage = async (newLanguage) => {
        if (!SUPPORTED_LANGUAGES[newLanguage]) {
            console.warn(`Unsupported language: ${newLanguage}`);
            return;
        }

        setCurrentLanguage(newLanguage);

        // Save preference
        try {
            await chrome.storage.local.set({ language: newLanguage });
        } catch (error) {
            console.error('Failed to save language preference:', error);
        }
    };

    /**
     * Translate a key to current language
     * @param {string} key - Translation key
     * @param {Object} params - Optional parameters for placeholder replacement
     * @returns {string} Translated text
     */
    const t = (key, params) => {
        // Get translation for current language
        const currentTranslations = translations[currentLanguage] || {};
        let text = currentTranslations[key];

        // Fallback to English if translation not found
        if (text === undefined) {
            const fallbackTranslations = translations[DEFAULT_LANGUAGE] || {};
            text = fallbackTranslations[key];

            // If still not found, return the key itself (for debugging)
            if (text === undefined) {
                console.warn(`Missing translation for key: ${key}`);
                return key;
            }
        }

        // Replace placeholders if parameters provided
        if (params) {
            text = replacePlaceholders(text, params);
        }

        return text;
    };

    const value = {
        currentLanguage,
        changeLanguage,
        t,
        isLoading,
        supportedLanguages: SUPPORTED_LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to access language context
 * @returns {Object} Language context with t(), changeLanguage(), etc.
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
