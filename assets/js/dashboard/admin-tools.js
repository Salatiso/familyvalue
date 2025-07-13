// This script will manage the Family Administration section of the dashboard.
// It handles creating a family, inviting members, and managing the family structure.

export async function renderFamilyAdminView(contentArea, db, user) {
    // Check if the user is an administrator of a family
    const familyAdminDoc = await db.collection('family_admins').doc(user.uid).get();

    if (familyAdminDoc.exists) {
        const familyId = familyAdminDoc.data().familyId;
        renderAdminDashboard(contentArea, db, user, familyId);
    } else {
        renderCreateFamilyWizard(contentArea, db, user);
    }
}

// --- 1. CREATE FAMILY WIZARD ---
function renderCreateFamilyWizard(contentArea, db, user) {
    const wizardSteps = {
        step1: {
            title: "Name Your Family",
            content: `<input type="text" id="family-name-input" placeholder="e.g., The Mdeni Jalamba Family" class="w-full p-3 border rounded-md">`
        },
        step2: {
            title: "Define Governance Roles",
            content: `
                <p class="text-sm text-gray-600 mb-4">Assign the initial key roles. You are the Administrator by default. You can change these roles later.</p>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium">Family Council Chairperson</label>
                        <input type="email" id="chairperson-email" placeholder="Enter Chairperson's Email" class="w-full p-2 border rounded-md">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Executive Team Member</label>
                        <input type="email" id="executive-email" placeholder="Enter Executive's Email" class="w-full p-2 border rounded-md">
                    </div>
                </div>`
        },
        step3: {
            title: "Accept Delegation of Authority",
            content: `<div id="delegation-content" class="h-64 overflow-y-auto border p-4 rounded-md bg-gray-50">Loading...</div>
                      <div class="mt-4 flex items-center">
                        <input type="checkbox" id="accept-doa-checkbox" class="h-4 w-4 rounded">
                        <label for="accept-doa-checkbox" class="ml-2 text-sm text-gray-700">I have read and accept the Delegation of Authority.</label>
                      </div>`
        }
    };
    
    contentArea.innerHTML = `
        <div class="dashboard-view active" id="family-admin-view">
            <div class="text-center bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <i class="fas fa-users text-5xl text-primary mb-4"></i>
                <h1 id="wizard-title" class="text-3xl font-bold text-dark mb-2"></h1>
                <div id="wizard-step-content" class="text-left"></div>
                <div class="flex justify-between mt-6">
                    <button id="wizard-back-btn" class="btn bg-gray-300 text-gray-700 hidden">Back</button>
                    <button id="wizard-next-btn" class="btn btn-primary">Next</button>
                </div>
            </div>
        </div>
    `;

    let currentStep = 1;
    const totalSteps = Object.keys(wizardSteps).length;

    function displayStep(step) {
        document.getElementById('wizard-title').innerText = wizardSteps[`step${step}`].title;
        document.getElementById('wizard-step-content').innerHTML = wizardSteps[`step${step}`].content;
        document.getElementById('wizard-back-btn').classList.toggle('hidden', step === 1);
        document.getElementById('wizard-next-btn').innerText = step === totalSteps ? 'Finish & Create Family' : 'Next';
        
        if (step === 3) {
            fetch('../components/delegation-of-authority.html')
                .then(res => res.text())
                .then(html => document.getElementById('delegation-content').innerHTML = html);
        }
    }

    document.getElementById('wizard-next-btn').addEventListener('click', async () => {
        if (currentStep < totalSteps) {
            currentStep++;
            displayStep(currentStep);
        } else {
            if (!document.getElementById('accept-doa-checkbox').checked) {
                alert("You must accept the Delegation of Authority to continue.");
                return;
            }
            const familyName = document.getElementById('family-name-input').value;
            if (!familyName) {
                alert("Family name is required.");
                currentStep = 1;
                displayStep(currentStep);
                return;
            }
            
            // --- Firestore Transaction Logic ---
            try {
                const newFamilyRef = db.collection('families').doc();
                const adminRef = db.collection('family_admins').doc(user.uid);

                await db.runTransaction(async (transaction) => {
                    // 1. Create the family document
                    transaction.set(newFamilyRef, {
                        name: familyName,
                        administrator: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    // 2. Set the current user as the admin for this new family
                    transaction.set(adminRef, {
                        familyId: newFamilyRef.id
                    });
                });
                
                alert(`Family Hub "${familyName}" created successfully!`);
                renderFamilyAdminView(contentArea, db, user);

            } catch (error) {
                console.error("Error creating family: ", error);
                alert("Failed to create family hub. Please try again.");
            }
        }
    });

    document.getElementById('wizard-back-btn').addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            displayStep(currentStep);
        }
    });

    displayStep(currentStep);
}


// --- 2. FAMILY ADMIN DASHBOARD ---
async function renderAdminDashboard(contentArea, db, user, familyId) {
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyName = familyDoc.exists ? familyDoc.data().name : "Your Family";

    const html = `
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
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4"><i class="fas fa-users mr-3 text-secondary"></i>Family Members</h2>
                        <div id="family-members-list" class="space-y-3">
                            <p class="text-gray-500">Loading members...</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-xl font-bold text-dark mb-4"><i class="fas fa-sitemap mr-3 text-secondary"></i>Family Organogram</h2>
                    <p class="text-sm text-gray-500 mb-4">A visual representation of your family structure. Only roles are shown here for privacy.</p>
                    <div id="organogram-container" class="border p-4 rounded-md bg-gray-50 min-h-[300px]">
                        <!-- Organogram will be rendered here -->
                        <div class="family-tree"><ul><li><div>You<span class="role">Administrator</span></div></li></ul></div>
                    </div>
                </div>

            </div>
        </div>
    `;
    contentArea.innerHTML = html;
    attachAdminDashboardListeners(db, user, familyId);
}

function attachAdminDashboardListeners(db, user, familyId) {
    const inviteForm = document.getElementById('invite-member-form');
    if (inviteForm) {
        inviteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('invite-email').value;
            try {
                // In a real app, this would trigger a Cloud Function to send a styled email.
                // For now, we'll just create a pending invite document.
                await db.collection('invites').add({
                    familyId: familyId,
                    invitedBy: user.uid,
                    recipientEmail: email.toLowerCase(),
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Invitation sent to ${email}. They need to sign up with this email to join.`);
                inviteForm.reset();
            } catch (error) {
                console.error("Error sending invite: ", error);
                alert("Could not send invitation.");
            }
        });
    }
}
