/*
    File: assets/js/core/main.js
    Description: Main entry point for the landing page.
    Changes:
    - Fixed the SPA navigation logic to prevent the sliding issue by ensuring it runs after all components are loaded.
    - Added a global `openConfirmationModal` function to replace `confirm()`.
    - Initializes the new i18n module.
    - Uses root-relative paths for fetching components for robustness.
*/
import { initializeAuth } from './auth.js';
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeI18n } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeAuth();
    initializeThemeSwitcher();
    // Load components and then initialize scripts that depend on them
    await loadComponents();
    await initializeI18n(); 
    setupNavigation();
});

async function loadComponents() {
    const componentMap = {
        'header-placeholder': '/familyvalue/components/header.html',
        'footer-placeholder': '/familyvalue/components/footer.html',
        'modals-placeholder': '/familyvalue/components/modals.html',
        'main-content-container': '/familyvalue/components/main-sections.html'
    };

    const fetchPromises = Object.entries(componentMap).map(async ([placeholderId, filePath]) => {
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Component not found: ${filePath}`);
                placeholder.innerHTML = await response.text();
            } catch (error) {
                console.error(`Error loading component from ${filePath}:`, error);
                placeholder.innerHTML = `<p class="text-red-500 text-center">Error loading content.</p>`;
            }
        }
    });

    // Wait for all components to be fetched and inserted into the DOM
    await Promise.all(fetchPromises);
    // Now that components are loaded, run setup that depends on them
    postLoadSetup();
}

function postLoadSetup() {
    fetch('/familyvalue/assets/svg/logo.svg')
        .then(res => res.text())
        .then(data => {
            const logoContainer = document.getElementById('logo-container');
            if (logoContainer) logoContainer.innerHTML = data;
        }).catch(console.error);
    
    document.getElementById('login-btn')?.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });
    document.getElementById('signup-btn')?.addEventListener('click', (e) => { e.preventDefault(); openModal('signupModal'); });
    document.getElementById('login-btn-mobile')?.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });

    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

function setupNavigation() {
    const mainContainer = document.getElementById('mainContainer');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.main-section');
    
    if (!mainContainer || !navLinks.length || sections.length === 0) {
        console.error("Navigation setup failed: key elements not found after load.");
        return;
    }

    mainContainer.style.width = `${sections.length * 100}%`;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(e.target.closest('.nav-link').dataset.section);
            navigateToSection(sectionIndex);
        });
    });

    navigateToSection(0);
}

window.navigateToSection = function(sectionIndex) {
    const mainContainer = document.getElementById('mainContainer');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.main-section');
    
    if (sections.length > 0 && sectionIndex >= 0 && sectionIndex < sections.length) {
        const percentage = sectionIndex * (100 / sections.length);
        mainContainer.style.transform = `translateX(-${percentage}%)`;
        
        navLinks.forEach(link => {
            link.classList.remove('text-primary', 'font-semibold');
            if (parseInt(link.dataset.section) === sectionIndex) {
                link.classList.add('text-primary', 'font-semibold');
            }
        });
        document.getElementById('mobileMenu')?.classList.add('hidden');
    }
}

// Global Modal Logic
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.add('active');
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('active');
}

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

window.openConfirmationModal = function(title, text, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    
    const confirmBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal('confirmModal');
    });

    cancelBtn.onclick = () => closeModal('confirmModal');
    
    openModal('confirmModal');
}
