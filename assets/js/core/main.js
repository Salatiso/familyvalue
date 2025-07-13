import { initializeAuth, onAuthChange } from './auth.js';
import { initializeThemeSwitcher } from './theme-switcher.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALIZE CORE MODULES ---
    initializeAuth();
    initializeThemeSwitcher();
    loadComponents();

    // --- DYNAMIC COMPONENT & CONTENT LOADING ---
    async function loadComponents() {
        // Load Header
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
        // Load other components like footer, modals etc.
    }

    function postHeaderLoad() {
        // Load Logo
        fetch('assets/svg/logo.svg')
            .then(res => res.text())
            .then(data => {
                const logoContainer = document.getElementById('logo-container');
                if (logoContainer) logoContainer.innerHTML = data;
            });
        
        // Setup Navigation
        setupNavigation();
        
        // Attach Modal Listeners
        document.getElementById('login-btn').addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });
        document.getElementById('signup-btn').addEventListener('click', (e) => { e.preventDefault(); openModal('signupModal'); });
        document.getElementById('login-btn-mobile').addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });

        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- SINGLE-PAGE-APP (SPA) NAVIGATION LOGIC ---
    let currentSection = 0;
    function setupNavigation() {
        const mainContainer = document.getElementById('mainContainer');
        const navLinks = document.querySelectorAll('.nav-link');
        
        if (!mainContainer) return;

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionIndex = parseInt(e.target.closest('.nav-link').dataset.section);
                navigateToSection(sectionIndex);
            });
        });
    }

    function navigateToSection(sectionIndex) {
        const mainContainer = document.getElementById('mainContainer');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.main-section');
        
        if (sectionIndex >= 0 && sectionIndex < sections.length) {
            mainContainer.style.transform = `translateX(-${sectionIndex * 100 / sections.length}%)`;
            currentSection = sectionIndex;
            
            navLinks.forEach(link => {
                link.classList.remove('text-primary', 'font-semibold');
                if (parseInt(link.dataset.section) === sectionIndex) {
                    link.classList.add('text-primary', 'font-semibold');
                }
            });
        }
    }

    // --- MODAL LOGIC ---
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
});
