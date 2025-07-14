/*
    File: assets/js/dashboard/dashboard-main.js
    Description: Main entry point for the dashboard.
    Changes:
    - Implemented a new `renderDashboardHome` function to create a dynamic dashboard.
    - The new dashboard shows profile completion status with progress bars.
    - Loads the new i18n.js module and the user's preferred language from Firestore.
    - Correctly wires up quick action buttons on the new dashboard home.
    - Uses root-relative paths for fetching components to fix 404 errors.
*/
import { initializeAuth, onAuthChange, logout } from '../core/auth.js';
import { initializeI18n, translatePage } from '../core/i18n.js';
import { renderLifeCvView } from './life-cv-manager.js';
import { renderFamilyAdminView } from './admin-tools.js';
import { renderReleaseHubView } from './release-protocol.js';
import { renderSettingsView } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let db = null;

    initializeAuth((auth, firestore) => {
        db = firestore;
        onAuthChange(auth, async (user) => {
            if (!user) {
                // This check is now primarily handled by the auth module's redirect logic,
                // but it's good practice to keep it as a fallback.
                window.location.href = '/familyvalue/index.html';
            } else {
                currentUser = user;
                // Fetch user's preferred language from Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userLang = userDoc.exists ? userDoc.data().primaryLang : 'en';
                
                // Initialize i18n with the user's language BEFORE loading components
                await initializeI18n(userLang);
                
                console.log("Dashboard access granted for user:", user.uid);
                loadDashboardComponents(db, user);
            }
        });
    });

    function loadDashboardComponents(db, user) {
        // Use root-relative paths to prevent 404 errors
        fetch('/familyvalue/components/sidebar-dashboard.html')
            .then(res => res.ok ? res.text() : Promise.reject('Sidebar not found'))
            .then(data => {
                const placeholder = document.getElementById('sidebar-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = data;
                    // Translate the newly loaded sidebar
                    translatePage(localStorage.getItem('familyValueLang') || 'en');
                    setupSidebarListeners(db, user);
                }
            }).catch(console.error);
        
        // Also fetch the modals component needed for the dashboard
        fetch('/familyvalue/components/modals.html')
            .then(res => res.ok ? res.text() : Promise.reject('Modals not found'))
            .then(data => {
                 const placeholder = document.getElementById('modals-placeholder');
                 if(placeholder) placeholder.innerHTML = data;
            }).catch(console.error);
    }
    
    function setupSidebarListeners(db, user) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                loadView(view, db, user);
            });
        });

        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        loadView('home', db, user);
    }

    function loadView(viewName, db, user) {
        const contentArea = document.getElementById('dashboard-content-area');
        
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        switch(viewName) {
            case 'home':
                renderDashboardHome(contentArea, db, user);
                break;
            case 'life-cv':
                renderLifeCvView(contentArea, db, user);
                break;
            case 'family-admin':
                 renderFamilyAdminView(contentArea, db, user);
                break;
            case 'release-hub':
                 renderReleaseHubView(contentArea, db, user);
                break;
            case 'settings':
                 renderSettingsView(contentArea, db, user);
                break;
            default:
                 contentArea.innerHTML = `<div class="dashboard-view active"><p>View not found.</p></div>`;
        }
    }
});

async function renderDashboardHome(contentArea, db, user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    const personalFields = ['name', 'dob', 'contactNumber', 'identityNumber', 'address'];
    const professionalFields = ['experience', 'education', 'skill'];
    const holisticFields = ['project', 'contribution'];

    let personalScore = 0;
    personalFields.forEach(field => {
        if (userData[field] && userData[field] !== '') personalScore++;
    });
    const personalCompletion = Math.round((personalScore / personalFields.length) * 100);

    const cvEntriesSnapshot = await db.collection('life_cvs').doc(user.uid).collection('entries').get();
    const entryTypes = new Set(cvEntriesSnapshot.docs.map(doc => doc.data().type));
    
    let professionalScore = 0;
    professionalFields.forEach(field => {
        if (entryTypes.has(field)) professionalScore++;
    });
    const professionalCompletion = Math.round((professionalScore / professionalFields.length) * 100);

    let holisticScore = 0;
    holisticFields.forEach(field => {
        if (entryTypes.has(field)) holisticScore++;
    });
    const holisticCompletion = Math.round((holisticScore / holisticFields.length) * 100);

    contentArea.innerHTML = `
        <div class="dashboard-view active">
            <h1 class="text-3xl font-bold text-dark mb-2" data-i18n="dashboard.welcome" data-name="${user.displayName || 'User'}"></h1>
            <p class="text-gray-600 mb-8" data-i18n="dashboard.welcome_subtitle"></p>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-xl font-bold text-dark mb-4" data-i18n="dashboard.profile_strength"></h2>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between mb-1"><span class="text-sm font-medium text-gray-700" data-i18n="dashboard.personal"></span><span class="text-sm font-medium text-gray-700">${personalCompletion}%</span></div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width: ${personalCompletion}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1"><span class="text-sm font-medium text-gray-700" data-i18n="dashboard.professional"></span><span class="text-sm font-medium text-gray-700">${professionalCompletion}%</span></div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-green-600 h-2.5 rounded-full" style="width: ${professionalCompletion}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1"><span class="text-sm font-medium text-gray-700" data-i18n="dashboard.holistic"></span><span class="text-sm font-medium text-gray-700">${holisticCompletion}%</span></div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-purple-600 h-2.5 rounded-full" style="width: ${holisticCompletion}%"></div></div>
                        </div>
                    </div>
                    <div class="mt-6 text-center"><a href="#" class="quick-action-link text-primary hover:underline" data-view="life-cv" data-i18n="dashboard.complete_profile_link"></a></div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-xl font-bold text-dark mb-4" data-i18n="dashboard.quick_actions"></h2>
                    <div class="space-y-3">
                        <button class="quick-action-link w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-3" data-view="life-cv"><i class="fas fa-id-card w-6 text-blue-500"></i><span data-i18n="dashboard.manage_cv"></span></button>
                        <button class="quick-action-link w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-3" data-view="family-admin"><i class="fas fa-users-cog w-6 text-green-500"></i><span data-i18n="dashboard.family_admin"></span></button>
                        <button class="quick-action-link w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-3" data-view="release-hub"><i class="fas fa-check-double w-6 text-purple-500"></i><span data-i18n="dashboard.release_hub"></span></button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Translate the newly rendered content
    translatePage(localStorage.getItem('familyValueLang') || 'en');

    contentArea.querySelectorAll('.quick-action-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            // Simulate a click on the main sidebar link to trigger the view change
            document.querySelector(`.main-container .sidebar-link[data-view="${view}"]`).click();
        });
    });
}
