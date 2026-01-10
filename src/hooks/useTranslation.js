import { useLanguage } from '../contexts/LanguageContext';

/**
 * Custom hook for translation
 * Provides the translation function and current language
 * @returns {Object} { t, currentLanguage, changeLanguage, supportedLanguages }
 */
export default function useTranslation() {
    return useLanguage();
}
