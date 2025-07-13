export function initializeThemeSwitcher() {
    const themePlaceholder = document.getElementById('theme-selector-placeholder');
    if (!themePlaceholder) return;

    const themeSelector = document.createElement('select');
    themeSelector.id = 'theme-selector';
    themeSelector.className = 'form-select bg-transparent text-white text-xs py-1 pl-8 pr-2 rounded-md appearance-none focus:ring-2 focus:ring-primary border-none';
    
    const themeIcon = document.createElement('i');
    themeIcon.className = 'fas fa-palette absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none';
    
    themePlaceholder.append(themeSelector, themeIcon);

    const themeOptions = {
        'theme-earthy-default': 'Earthy Default',
        'theme-flamea-fire': 'Flamea Fire',
        'theme-flamea-meadow': 'Flamea Meadow',
        'theme-ocean-sky': 'Ocean & Sky',
        'theme-playful-shapes': 'Playful Shapes',
    };

    for (const [value, text] of Object.entries(themeOptions)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        option.style.backgroundColor = 'var(--dark)'; // For dropdown options
        themeSelector.appendChild(option);
    }

    themeSelector.addEventListener('change', (e) => {
        const themeName = e.target.value;
        document.body.className = themeName;
        localStorage.setItem('familyValueTheme', themeName);
    });

    const savedTheme = localStorage.getItem('familyValueTheme') || 'theme-earthy-default';
    document.body.className = savedTheme;
    themeSelector.value = savedTheme;
}
