import { initializeAuth, logout } from '../core/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    loadDashboardComponents();

    function loadDashboardComponents() {
        // Load Sidebar
        fetch('../components/sidebar-dashboard.html')
            .then(res => res.text())
            .then(data => {
                const placeholder = document.getElementById('sidebar-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = data;
                    setupSidebarListeners();
                }
            });
    }
    
    function setupSidebarListeners() {
        // Add event listeners for sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                loadView(view);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
                window.location.href = '../index.html';
            });
        }

        // Load initial view
        loadView('home');
    }

    function loadView(viewName) {
        const contentArea = document.getElementById('dashboard-content-area');
        let html = '';

        // Basic router
        switch(viewName) {
            case 'home':
                html = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Dashboard Home</h1>
                        <p class="text-dark">Welcome to your Family Value dashboard. Here you can manage your Life CV, your family structure, and more.</p>
                        <!-- Add summary cards here -->
                    </div>`;
                break;
            case 'life-cv':
                 html = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">My Life CV</h1>
                        <p class="text-dark">This is where you will manage all entries for your Life CV. Add skills, experiences, and projects.</p>
                        <!-- Life CV manager UI will go here -->
                    </div>`;
                break;
            case 'family-admin':
                 html = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Family Administration</h1>
                        <p class="text-dark">Manage family members, the organogram, and governance roles.</p>
                        <!-- Admin tools UI will go here -->
                    </div>`;
                break;
            default:
                 html = `<div class="dashboard-view active"><p>View not found.</p></div>`;
        }
        contentArea.innerHTML = html;
        
        // Update active link in sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });
    }
});
