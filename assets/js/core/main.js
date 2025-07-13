import { initializeAuth } from './auth.js';
import { initializeThemeSwitcher } from './theme-switcher.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeThemeSwitcher();
    loadComponents();
});

async function loadComponents() {
    // --- Load Header ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        try {
            const response = await fetch('components/header.html');
            const data = await response.text();
            headerPlaceholder.innerHTML = data;
            postHeaderLoad();
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }
    
    // --- Load Footer ---
    const footerPlaceholder = document.getElementById('footer-placeholder');
     if (footerPlaceholder) {
        try {
            const response = await fetch('components/footer.html');
            const data = await response.text();
            footerPlaceholder.innerHTML = data;
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    // --- Load Modals ---
    const modalsPlaceholder = document.getElementById('modals-placeholder');
    if (modalsPlaceholder) {
        try {
            const response = await fetch('components/modals.html');
            const data = await response.text();
            modalsPlaceholder.innerHTML = data;
        } catch (error) {
            console.error('Error loading modals:', error);
        }
    }

     // --- Load Page Sections ---
    const mainContent = document.getElementById('main-content-container');
    if(mainContent) {
        try {
            const response = await fetch('components/main-sections.html');
            const data = await response.text();
            mainContent.innerHTML = data;
            // Re-run navigation setup after content is loaded
            setupNavigation();
        } catch (error) {
             console.error('Error loading main sections:', error);
        }
    }
}

function postHeaderLoad() {
    fetch('assets/svg/logo.svg')
        .then(res => res.text())
        .then(data => {
            const logoContainer = document.getElementById('logo-container');
            if (logoContainer) logoContainer.innerHTML = data;
        });
    
    // Attach Modal Listeners
    document.getElementById('login-btn').addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });
    document.getElementById('signup-btn').addEventListener('click', (e) => { e.preventDefault(); openModal('signupModal'); });
    const loginMobile = document.getElementById('login-btn-mobile');
    if(loginMobile) loginMobile.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });

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
    
    if (!mainContainer || !navLinks.length) return;

    let currentSection = 0;

    function navigateToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < sections.length) {
            mainContainer.style.transform = `translateX(-${sectionIndex * 100 / sections.length}%)`;
            currentSection = sectionIndex;
            
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

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(e.target.closest('.nav-link').dataset.section);
            navigateToSection(sectionIndex);
        });
    });

    navigateToSection(0);
}

// --- Global Modal Logic ---
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
