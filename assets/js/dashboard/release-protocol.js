/*
    File: assets/js/dashboard/release-protocol.js
    Description: Manages the content release approval workflow.
    Changes:
    - `initiateReleaseRequest`: Now checks if a user is an adult (>= 13). If so, it auto-approves the request for individuals not in a family.
    - `renderReleaseHubView`: Now correctly checks if a user is part of a family to display relevant requests.
    - Added `approveRequest` and `denyRequest` functions with Firestore logic.
    - Event listeners are now attached to the approve/deny buttons.
    - Uses custom modals for user feedback instead of `alert()`.
*/
import { translatePage } from '../core/i18n.js';

export async function initiateReleaseRequest(db, user, entryId, entryTitle) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            console.error("User document not found.");
            return false;
        }
        const userData = userDoc.data();
        const isAdult = userData.dob ? (new Date().getFullYear() - new Date(userData.dob).getFullYear()) >= 13 : true;

        const familyId = await getFamilyIdForUser(db, user.uid);

        if (isAdult && !familyId) {
            await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).update({ releaseStatus: 'approved' });
            openModal('successModal');
            return true;
        }
        
        if (!familyId) {
            openConfirmationModal('Family Required', 'Minors (under 13) must be part of a family to request public release of their information.', () => {});
            return false;
        }

        const existingRequest = await db.collection('families').doc(familyId).collection('release_requests')
            .where('entryId', '==', entryId)
            .where('status', 'in', ['pending_executive'])
            .get();

        if (!existingRequest.empty) {
            openConfirmationModal('Request Pending', 'An approval request for this item is already pending.', () => {});
            return false;
        }

        const releaseRequestRef = db.collection('families').doc(familyId).collection('release_requests').doc();
        
        await releaseRequestRef.set({
            requesterId: user.uid,
            requesterName: user.displayName || user.email,
            entryId: entryId,
            entryTitle: entryTitle,
            status: 'pending_executive',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            history: [{ status: 'created', timestamp: firebase.firestore.FieldValue.serverTimestamp(), actor: user.uid }]
        });

        await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).update({ releaseStatus: 'pending' });
        openModal('successModal');
        return true;
    } catch (error) {
        console.error("Error initiating release request: ", error);
        return false;
    }
}

export async function renderReleaseHubView(contentArea, db, user) {
    const familyId = await getFamilyIdForUser(db, user.uid);
    if (!familyId) {
        contentArea.innerHTML = `<div class="dashboard-view active"><p class="text-gray-600" data-i18n="release.no_family"></p></div>`;
        translatePage(localStorage.getItem('familyValueLang') || 'en');
        return;
    }

    contentArea.innerHTML = `
        <div class="dashboard-view active" id="release-hub-view">
            <h1 class="text-3xl font-bold text-dark mb-6">Content Release Hub</h1>
            <p class="text-gray-600 mb-6">Review and approve requests from family members to make their information public.</p>
            <div id="requests-list" class="space-y-4"><p class="text-center text-gray-500 py-8">Loading release requests...</p></div>
        </div>
    `;
    loadAndAttachReleaseListeners(db, familyId, user);
}

async function loadAndAttachReleaseListeners(db, familyId, user) {
    const listContainer = document.getElementById('requests-list');
    try {
        const requestsSnapshot = await db.collection('families').doc(familyId).collection('release_requests').orderBy('createdAt', 'desc').get();
        if (requestsSnapshot.empty) {
            listContainer.innerHTML = `<p class="text-center text-gray-500 py-8">There are no pending release requests.</p>`;
            return;
        }

        listContainer.innerHTML = requestsSnapshot.docs.map(doc => {
            const request = doc.data();
            const canAct = request.status.startsWith('pending');
            return `
                <div class="bg-white p-4 rounded-lg shadow-sm border">
                    <p class="font-bold text-dark">"${request.entryTitle}"</p>
                    <p class="text-sm text-gray-600">Requested by: <strong>${request.requesterName}</strong></p>
                    <div class="mt-4 pt-4 border-t">
                        <p class="text-sm font-semibold">Status: <span class="font-bold uppercase ${getStatusColor(request.status)}">${request.status.replace(/_/g, ' ')}</span></p>
                        ${canAct ? `<div class="flex gap-4 mt-2">
                            <button class="approve-request-btn btn btn-sm bg-green-500 text-white" data-id="${doc.id}" data-entryid="${request.entryId}" data-requesterid="${request.requesterId}">Approve</button>
                            <button class="deny-request-btn btn btn-sm bg-red-500 text-white" data-id="${doc.id}" data-entryid="${request.entryId}" data-requesterid="${request.requesterId}">Deny</button>
                        </div>` : ''}
                    </div>
                </div>`;
        }).join('');
        
        document.querySelectorAll('.approve-request-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const { id, entryid, requesterid } = e.currentTarget.dataset;
            approveRequest(db, familyId, user, id, entryid, requesterid);
        }));
        document.querySelectorAll('.deny-request-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const { id, entryid, requesterid } = e.currentTarget.dataset;
            denyRequest(db, familyId, user, id, entryid, requesterid);
        }));
    } catch (error) {
        console.error("Error loading release requests: ", error);
    }
}

async function approveRequest(db, familyId, approver, requestId, entryId, requesterId) {
    const requestRef = db.collection('families').doc(familyId).collection('release_requests').doc(requestId);
    const entryRef = db.collection('life_cvs').doc(requesterId).collection('entries').doc(entryId);
    try {
        await db.runTransaction(async (t) => {
            t.update(requestRef, { status: 'approved' });
            t.update(entryRef, { releaseStatus: 'approved' });
        });
        loadAndAttachReleaseListeners(db, familyId, approver);
    } catch (error) { console.error("Error approving request: ", error); }
}

async function denyRequest(db, familyId, approver, requestId, entryId, requesterId) {
    const requestRef = db.collection('families').doc(familyId).collection('release_requests').doc(requestId);
    const entryRef = db.collection('life_cvs').doc(requesterId).collection('entries').doc(entryId);
    try {
        await db.runTransaction(async (t) => {
            t.update(requestRef, { status: 'denied' });
            t.update(entryRef, { releaseStatus: 'private' });
        });
        loadAndAttachReleaseListeners(db, familyId, approver);
    } catch (error) { console.error("Error denying request: ", error); }
}

async function getFamilyIdForUser(db, userId) {
    const adminDoc = await db.collection('family_admins').doc(userId).get();
    if (adminDoc.exists) return adminDoc.data().familyId;
    return null;
}

function getStatusColor(status) {
    if (status.startsWith('pending')) return 'text-yellow-600';
    if (status === 'approved') return 'text-green-600';
    if (status === 'denied') return 'text-red-600';
    return 'text-gray-600';
}
