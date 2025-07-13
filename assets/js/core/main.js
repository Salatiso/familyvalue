import { initializeAuth } from './auth.js';
import { initializeThemeSwitcher } from './theme-switcher.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeThemeSwitcher();
    loadComponents();
});

async function loadComponents() {
    const componentMap = {
        'header-placeholder': 'components/header.html',
        'footer-placeholder': 'components/footer.html',
        'modals-placeholder': 'components/modals.html',
        'main-content-container': 'components/main-sections.html'
    };

    for (const [placeholderId, filePath] of Object.entries(componentMap)) {
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Component not found: ${filePath}`);
                const data = await response.text();
                placeholder.innerHTML = data;
                console.log(`${filePath} loaded successfully.`);
            } catch (error) {
                console.error(`Error loading component from ${filePath}:`, error);
                placeholder.innerHTML = `<p class="text-red-500 text-center">Error loading content.</p>`;
            }
        }
    }
    // Post-load initializations
    postLoadSetup();
}

function postLoadSetup() {
    // Load Logo
    fetch('assets/svg/logo.svg')
        .then(res => res.text())
        .then(data => {
            const logoContainer = document.getElementById('logo-container');
            if (logoContainer) logoContainer.innerHTML = data;
        }).catch(console.error);
    
    // Attach Modal Listeners
    document.getElementById('login-btn')?.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });
    document.getElementById('signup-btn')?.addEventListener('click', (e) => { e.preventDefault(); openModal('signupModal'); });
    const loginMobile = document.getElementById('login-btn-mobile');
    if(loginMobile) loginMobile.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    
    // Setup SPA Navigation
    setupNavigation();
}

function setupNavigation() {
    const mainContainer = document.getElementById('mainContainer');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!mainContainer || !navLinks.length) {
        // If called before content is loaded, wait and retry
        setTimeout(setupNavigation, 100);
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(e.target.closest('.nav-link').dataset.section);
            navigateToSection(sectionIndex);
        });
    });

    navigateToSection(0); // Set initial section
}

window.navigateToSection = function(sectionIndex) {
    const mainContainer = document.getElementById('mainContainer');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.main-section');
    
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
        mainContainer.style.transform = `translateX(-${sectionIndex * 100 / sections.length}%)`;
        
        navLinks.forEach(link => {
            link.classList.remove('text-primary', 'font-semibold');
            if (parseInt(link.dataset.section) === sectionIndex) {
                link.classList.add('text-primary', 'font-semibold');
            }
        });
        const mobileMenu = document.getElementById('mobileMenu');
        if(mobileMenu) mobileMenu.classList.add('hidden');
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
