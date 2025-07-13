import { initializeAuth, onAuthChange, logout } from '../core/auth.js';
import { renderLifeCvView } from './life-cv-manager.js';
import { renderFamilyAdminView } from './admin-tools.js';
import { renderReleaseHubView } from './release-protocol.js'; // Import the new release hub view

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let db = null;
    let familyId = null; // Store family ID for the user

    initializeAuth((auth, firestore) => {
        db = firestore;
        onAuthChange(auth, async (user) => {
            if (!user) {
                window.location.href = '../index.html';
            } else {
                currentUser = user;
                // Check if user is an admin to get familyId
                const familyAdminDoc = await db.collection('family_admins').doc(user.uid).get();
                if (familyAdminDoc.exists) {
                    familyId = familyAdminDoc.data().familyId;
                }
                console.log("Dashboard access granted for user:", user.uid);
                loadDashboardComponents();
            }
        });
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

        loadView('home');
    }

    function loadView(viewName) {
        const contentArea = document.getElementById('dashboard-content-area');
        
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        switch(viewName) {
            case 'home':
                contentArea.innerHTML = `
                    <div class="dashboard-view active">
                        <h1 class="text-3xl font-bold text-dark mb-4">Dashboard Home</h1>
                        <p class="text-dark">Welcome, ${currentUser.displayName || 'User'}. This is your central hub for managing your personal and family legacy.</p>
                    </div>`;
                break;
            case 'life-cv':
                renderLifeCvView(contentArea, db, currentUser);
                break;
            case 'family-admin':
                 renderFamilyAdminView(contentArea, db, currentUser);
                break;
            case 'release-hub':
                 if (familyId) {
                    renderReleaseHubView(contentArea, db, familyId);
                 } else {
                    contentArea.innerHTML = `<div class="dashboard-view active"><p>You must be a family administrator to access this page.</p></div>`;
                 }
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
