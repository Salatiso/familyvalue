import { initializeAuth, onAuthChange, logout } from '../core/auth.js';
import { renderLifeCvView } from './life-cv-manager.js'; // Import the new view renderer

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    loadDashboardComponents();

    onAuthChange((user) => {
        if (!user) {
            // If no user, redirect to login page. This protects the dashboard.
            window.location.href = '../login.html';
        } else {
            // User is logged in, proceed to load dashboard content
            console.log("Dashboard access granted for user:", user.uid);
        }
    });

    function loadDashboardComponents() {
        fetch('../components/sidebar-dashboard.html')
            .then(res => res.ok ? res.text() : Promise.reject('Sidebar not found'))
            .then(data => {
                const placeholder = document.getElementById('sidebar-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = data;
                    setupSidebarListeners();
                }
            }).catch(console.error);
    }
    
    function setupSidebarListeners() {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                loadView(view);
            });
        });

        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Load initial view
        loadView('home');
    }

    function loadView(viewName) {
        const contentArea = document.getElementById('dashboard-content-area');
        
        // Deactivate all links first
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        
        // Activate the current link
        const activeLink = document.querySelector(`.sidebar-link[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        // View router
        switch(viewName) {
            case 'home':
                contentArea.innerHTML = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Dashboard Home</h1>
                        <p class="text-dark">Welcome to your Family Value dashboard. Here you can manage your Life CV, your family structure, and more.</p>
                    </div>`;
                break;
            case 'life-cv':
                // Call the dedicated function to render this complex view
                renderLifeCvView(contentArea);
                break;
            case 'family-admin':
                 contentArea.innerHTML = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Family Administration</h1>
                        <p class="text-dark">Manage family members, the organogram, and governance roles. (Phase 2)</p>
                    </div>`;
                break;
            case 'settings':
                 contentArea.innerHTML = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Settings</h1>
                        <p class="text-dark">Manage your account and notification settings here.</p>
                    </div>`;
                break;
            default:
                 contentArea.innerHTML = `<div class="dashboard-view active"><p>View not found.</p></div>`;
        }
    }
});
