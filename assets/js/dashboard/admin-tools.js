/*
    File: assets/js/dashboard/admin-tools.js
    Description: Manages the Family Administration section.
    Changes:
    - Replaced all `alert()` calls with the new custom modal system (`openConfirmationModal` or a simple message modal).
    - The core logic for creating a family and inviting members remains the same, but with improved user feedback.
    - Uses root-relative path to fetch `delegation-of-authority.html`.
*/
import { translatePage } from '../core/i18n.js';

export async function renderFamilyAdminView(contentArea, db, user) {
    const familyAdminDoc = await db.collection('family_admins').doc(user.uid).get();
    if (familyAdminDoc.exists) {
        const familyId = familyAdminDoc.data().familyId;
        renderAdminDashboard(contentArea, db, user, familyId);
    } else {
        renderCreateFamilyWizard(contentArea, db, user);
    }
}

function renderCreateFamilyWizard(contentArea, db, user) {
    contentArea.innerHTML = `
        <div class="dashboard-view active" id="family-admin-view">
            <div class="text-center bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <i class="fas fa-users text-5xl text-primary mb-4"></i>
                <div id="wizard-content"></div>
                <div id="form-message" class="text-red-500 text-sm my-2"></div>
            </div>
        </div>
    `;
    const wizardContainer = document.getElementById('wizard-content');
    let currentStep = 1;
    const wizardData = {};

    const displayStep = () => {
        if (currentStep === 1) {
            wizardContainer.innerHTML = `
                <h1 class="text-3xl font-bold text-dark mb-2">Name Your Family Hub</h1>
                <input type="text" id="family-name-input" placeholder="e.g., The Mdeni Jalamba Family" class="w-full p-3 border rounded-md">
                <div class="flex justify-end mt-6"><button id="wizard-next-btn" class="btn btn-primary">Next</button></div>`;
            document.getElementById('family-name-input').value = wizardData.familyName || '';
        } else if (currentStep === 2) {
            wizardContainer.innerHTML = `
                <h1 class="text-3xl font-bold text-dark mb-2">Accept Delegation of Authority</h1>
                <div id="delegation-content" class="h-64 overflow-y-auto border p-4 rounded-md bg-gray-50 text-left text-sm">Loading...</div>
                <div class="mt-4 flex items-center"><input type="checkbox" id="accept-doa-checkbox" class="h-4 w-4 rounded"><label for="accept-doa-checkbox" class="ml-2 text-sm text-gray-700">I have read and accept the Delegation of Authority.</label></div>
                <div class="flex justify-between mt-6"><button id="wizard-back-btn" class="btn bg-gray-300 text-gray-700">Back</button><button id="wizard-finish-btn" class="btn btn-primary">Finish & Create Family</button></div>`;
            fetch('/familyvalue/components/delegation-of-authority.html').then(res => res.text()).then(html => document.getElementById('delegation-content').innerHTML = html);
        }
    }

    wizardContainer.addEventListener('click', async (e) => {
        const messageEl = document.getElementById('form-message');
        messageEl.textContent = '';

        if (e.target.id === 'wizard-next-btn') {
            const familyName = document.getElementById('family-name-input').value;
            if (!familyName.trim()) {
                messageEl.textContent = 'Family name is required.';
                return;
            }
            wizardData.familyName = familyName;
            currentStep = 2;
            displayStep();
        }
        if (e.target.id === 'wizard-back-btn') {
            currentStep = 1;
            displayStep();
        }
        if (e.target.id === 'wizard-finish-btn') {
            if (!document.getElementById('accept-doa-checkbox').checked) {
                messageEl.textContent = 'You must accept the Delegation of Authority to continue.';
                return;
            }
            try {
                const newFamilyRef = db.collection('families').doc();
                const adminRef = db.collection('family_admins').doc(user.uid);
                await db.runTransaction(async (transaction) => {
                    transaction.set(newFamilyRef, { name: wizardData.familyName, administrator: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
                    transaction.set(adminRef, { familyId: newFamilyRef.id });
                });
                openModal('successModal');
                renderFamilyAdminView(contentArea, db, user);
            } catch (error) {
                console.error("Error creating family: ", error);
                messageEl.textContent = 'Failed to create family hub. Please try again.';
            }
        }
    });
    displayStep();
}

async function renderAdminDashboard(contentArea, db, user, familyId) {
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyName = familyDoc.exists ? familyDoc.data().name : "Your Family";

    contentArea.innerHTML = `
        <div class="dashboard-view active" id="family-admin-view">
            <h1 class="text-3xl font-bold text-dark mb-6">${familyName} - Admin Hub</h1>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4 flex items-center"><i class="fas fa-user-plus mr-3 text-secondary"></i>Invite New Member</h2>
                        <form id="invite-member-form" class="flex flex-col sm:flex-row gap-4">
                            <input type="email" id="invite-email" placeholder="Enter member's email address" required class="flex-grow p-3 border rounded-md">
                            <button type="submit" class="btn btn-secondary">Send Invite</button>
                        </form>
                        <div id="invite-message" class="text-sm mt-2"></div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4"><i class="fas fa-users mr-3 text-secondary"></i>Family Members</h2>
                        <div id="family-members-list" class="space-y-3"><p class="text-gray-500">Loading members...</p></div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-xl font-bold text-dark mb-4"><i class="fas fa-sitemap mr-3 text-secondary"></i>Family Organogram</h2>
                    <div id="organogram-container" class="border p-4 rounded-md bg-gray-50 min-h-[300px]"><div class="family-tree"><ul><li><div>You<span class="role">Administrator</span></div></li></ul></div></div>
                </div>
            </div>
        </div>
    `;
    attachAdminDashboardListeners(db, user, familyId);
    // Translate the newly rendered content
    translatePage(localStorage.getItem('familyValueLang') || 'en');
}

function attachAdminDashboardListeners(db, user, familyId) {
    const inviteForm = document.getElementById('invite-member-form');
    if (inviteForm) {
        inviteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('invite-email').value;
            const messageEl = document.getElementById('invite-message');
            messageEl.textContent = '';
            try {
                await db.collection('invites').add({
                    familyId: familyId,
                    invitedBy: user.uid,
                    recipientEmail: email.toLowerCase(),
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageEl.textContent = `Invitation sent to ${email}.`;
                messageEl.className = 'text-green-600 text-sm mt-2';
                inviteForm.reset();
            } catch (error) {
                console.error("Error sending invite: ", error);
                messageEl.textContent = 'Could not send invitation.';
                messageEl.className = 'text-red-600 text-sm mt-2';
            }
        });
    }
}
