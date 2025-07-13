// This script contains the core logic for the "Handshake" protocol,
// managing the multi-stage approval workflow for making information public.

/**
 * Initiates a request to make a Life CV entry public.
 * This is called from the life-cv-manager.js script.
 * @param {object} db - The Firestore instance.
 * @param {object} user - The currently authenticated user object.
 * @param {string} entryId - The ID of the Life CV entry to be released.
 * @param {string} entryTitle - The title of the entry for notification purposes.
 * @returns {Promise<boolean>} - True if the request was submitted successfully.
 */
export async function initiateReleaseRequest(db, user, entryId, entryTitle) {
    try {
        const familyId = await getFamilyIdForUser(db, user.uid);
        if (!familyId) {
            alert("You must be part of a family to request public release.");
            return false;
        }

        // Check if a pending request for this item already exists
        const existingRequest = await db.collection('families').doc(familyId).collection('release_requests')
            .where('entryId', '==', entryId)
            .where('status', 'in', ['pending_guardian', 'pending_admin', 'pending_executive'])
            .get();

        if (!existingRequest.empty) {
            alert('An approval request for this item is already pending.');
            return false;
        }

        const releaseRequestRef = db.collection('families').doc(familyId).collection('release_requests').doc();
        
        await releaseRequestRef.set({
            requesterId: user.uid,
            requesterName: user.displayName || user.email,
            entryId: entryId,
            entryTitle: entryTitle,
            status: 'pending_guardian', // First step is always guardian/self-approval
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvals: {
                guardian: null,
                admin: null,
                chairperson: null,
                executive: null
            },
            history: [{
                status: 'created',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                actor: user.uid
            }]
        });

        await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).update({
            releaseStatus: 'pending'
        });

        alert(`Request to publish "${entryTitle}" has been submitted for approval.`);
        return true;
    } catch (error) {
        console.error("Error initiating release request: ", error);
        alert("Could not submit request. Please try again.");
        return false;
    }
}

/**
 * Renders the Content Release Hub for administrators.
 * @param {HTMLElement} contentArea - The element to render the view into.
 * @param {object} db - The Firestore instance.
 * @param {string} familyId - The ID of the family being administered.
 */
export async function renderReleaseHubView(contentArea, db, familyId) {
    const html = `
        <div class="dashboard-view active" id="release-hub-view">
            <h1 class="text-3xl font-bold text-dark mb-6">Content Release Hub</h1>
            <p class="text-gray-600 mb-6">Review and approve requests from family members to make their information public. A multi-stage approval process ensures security and protects the family's integrity.</p>
            <div id="requests-list" class="space-y-4">
                <p class="text-center text-gray-500 py-8">Loading release requests...</p>
            </div>
        </div>
    `;
    contentArea.innerHTML = html;
    loadReleaseRequests(db, familyId);
}

async function loadReleaseRequests(db, familyId) {
    const listContainer = document.getElementById('requests-list');
    try {
        const requestsSnapshot = await db.collection('families').doc(familyId).collection('release_requests').orderBy('createdAt', 'desc').get();

        if (requestsSnapshot.empty) {
            listContainer.innerHTML = `<p class="text-center text-gray-500 py-8">There are no pending release requests.</p>`;
            return;
        }

        let requestsHTML = '';
        requestsSnapshot.forEach(doc => {
            const request = doc.data();
            requestsHTML += `
                <div class="bg-white p-4 rounded-lg shadow-sm border">
                    <p class="font-bold text-dark">"${request.entryTitle}"</p>
                    <p class="text-sm text-gray-600">Requested by: <strong>${request.requesterName}</strong></p>
                    <div class="mt-4 pt-4 border-t">
                        <p class="text-sm font-semibold">Approval Status: <span class="font-bold uppercase ${getStatusColor(request.status)}">${request.status.replace(/_/g, ' ')}</span></p>
                        <!-- Approval action buttons would go here -->
                        <div class="flex gap-4 mt-2">
                            <button class="btn btn-sm bg-green-500 text-white">Approve</button>
                            <button class="btn btn-sm bg-red-500 text-white">Deny</button>
                        </div>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = requestsHTML;

    } catch (error) {
        console.error("Error loading release requests: ", error);
        listContainer.innerHTML = `<p class="text-center text-red-500 py-8">Could not load release requests.</p>`;
    }
}


// --- Helper Functions ---

async function getFamilyIdForUser(db, userId) {
    // This function checks if a user is part of a family.
    const adminDoc = await db.collection('family_admins').doc(userId).get();
    if (adminDoc.exists) return adminDoc.data().familyId;
    
    // In a real app, you would also check if they are a member of a family, not just an admin.
    // This requires a different data structure, e.g., a 'members' subcollection in the family doc.
    return null;
}

function getStatusColor(status) {
    switch(status) {
        case 'pending_guardian': return 'text-yellow-600';
        case 'pending_admin': return 'text-blue-600';
        case 'pending_executive': return 'text-purple-600';
        case 'approved': return 'text-green-600';
        case 'denied': return 'text-red-600';
        default: return 'text-gray-600';
    }
}
