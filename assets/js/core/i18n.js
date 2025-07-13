/*
    File: assets/js/core/i18n.js (New File)
    Description: Handles all internationalization (i18n) logic.
    - Fetches language JSON files from the `/lang/` directory.
    - Caches loaded languages to avoid re-fetching.
    - Provides a function to translate the page based on data-i18n keys.
    - Sets up the language switcher on the main page and in the dashboard settings.
*/
const translations = {};
let currentLang = 'en';

async function fetchLanguage(lang) {
    if (translations[lang]) {
        return translations[lang];
    }
    try {
        // This path works from both root and /dashboard/ since it's relative to the domain root
        const response = await fetch(`/familyvalue/lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load language file: ${lang}.json`);
        }
        const data = await response.json();
        translations[lang] = data;
        return data;
    } catch (error) {
        console.error(error);
        return {}; // Return empty object on failure
    }
}

function translateElement(element, langData) {
    const key = element.dataset.i18n;
    const name = element.dataset.name || ''; // For dynamic values like usernames

    const keys = key.split('.');
    let text = keys.reduce((obj, k) => (obj && obj[k] !== 'undefined') ? obj[k] : null, langData);
    
    if (text) {
        text = text.replace('{name}', name);
        const placeholder = element.getAttribute('placeholder');
        if (placeholder !== null) {
            element.setAttribute('placeholder', text);
        } else {
            // Use textContent for security instead of innerHTML
            element.textContent = text;
        }
    }
}

export async function translatePage(lang) {
    if (!lang) lang = 'en';
    currentLang = lang;
    
    const langData = await fetchLanguage(lang);
    if (Object.keys(langData).length === 0) {
        console.warn(`Translation data for "${lang}" is empty or failed to load.`);
        return;
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
        translateElement(element, langData);
    });
    
    document.documentElement.lang = lang;
}

export async function initializeI18n(defaultLang = 'en') {
    const setupSwitcher = (switcherId) => {
        const switcher = document.getElementById(switcherId);
        if (switcher) {
            switcher.addEventListener('change', (e) => {
                const newLang = e.target.value;
                localStorage.setItem('familyValueLang', newLang);
                translatePage(newLang);
            });
            const savedLang = localStorage.getItem('familyValueLang') || defaultLang;
            switcher.value = savedLang;
        }
    };

    setupSwitcher('language-selector'); // For the main site header
    
    const savedLang = localStorage.getItem('familyValueLang') || defaultLang;
    await translatePage(savedLang);
}
