/**
 * Translation Completeness Checker
 * 
 * This script checks for missing or extra translation keys between different language files.
 * Run with: npm run check-i18n or node scripts/check-i18n.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const REFERENCE_LANG = 'en'; // English is the reference language

function loadTranslations(lang) {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error loading${lang}.json:`, error.message);
        return null;
    }
}

function getAllLanguages() {
    try {
        const files = fs.readdirSync(LOCALES_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (error) {
        console.error(`Error reading locales directory:`, error.message);
        return [];
    }
}

function checkTranslations() {
    const languages = getAllLanguages();

    if (languages.length === 0) {
        console.error('No language files found!');
        process.exit(1);
    }

    console.log(`Found languages: ${languages.join(', ')}\n`);

    const referenceTranslations = loadTranslations(REFERENCE_LANG);
    if (!referenceTranslations) {
        console.error(`Reference language (${REFERENCE_LANG}) not found!`);
        process.exit(1);
    }

    const referenceKeys = new Set(Object.keys(referenceTranslations));
    let hasErrors = false;

    // Check each language against the reference
    for (const lang of languages) {
        if (lang === REFERENCE_LANG) continue;

        console.log(`Checking ${lang}.json against ${REFERENCE_LANG}.json...`);

        const langTranslations = loadTranslations(lang);
        if (!langTranslations) {
            hasErrors = true;
            continue;
        }

        const langKeys = new Set(Object.keys(langTranslations));

        // Find missing keys
        const missingKeys = [...referenceKeys].filter(key => !langKeys.has(key));
        if (missingKeys.length > 0) {
            console.error(`  ❌ Missing keys in ${lang}.json:`);
            missingKeys.forEach(key => console.error(`     - ${key}`));
            hasErrors = true;
        }

        // Find extra keys
        const extraKeys = [...langKeys].filter(key => !referenceKeys.has(key));
        if (extraKeys.length > 0) {
            console.error(`  ⚠️  Extra keys in ${lang}.json (not in reference):`);
            extraKeys.forEach(key => console.error(`     - ${key}`));
            hasErrors = true;
        }

        if (missingKeys.length === 0 && extraKeys.length === 0) {
            console.log(`  ✅ ${lang}.json is complete and matches ${REFERENCE_LANG}.json`);
        }

        console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    if (hasErrors) {
        console.error('❌ Translation check FAILED!');
        console.error('Please fix the issues above.');
        process.exit(1);
    } else {
        console.log('✅ All translations are complete and consistent!');
        process.exit(0);
    }
}

// Run the check
checkTranslations();
