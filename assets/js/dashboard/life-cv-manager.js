// This script will manage the Life CV section of the dashboard.
import { initiateReleaseRequest } from './release-protocol.js'; // Import the handshake function

export function renderLifeCvView(contentArea, db, user) {
    const html = `
        <div class="dashboard-view active" id="life-cv-view">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-dark">My Life CV</h1>
                <button id="add-entry-btn" class="btn btn-primary"><i class="fas fa-plus mr-2"></i>Add New Entry</button>
            </div>
            
            <p class="text-gray-600 mb-6">This is your private, central repository of all skills, experiences, projects, and credentials. To make an item public on your profile, click the toggle to begin the family approval process.</p>

            <div id="entry-form-container" class="bg-white p-6 rounded-lg shadow-md mb-8 hidden">
                <h2 class="text-xl font-bold text-dark mb-4">New CV Entry</h2>
                <form id="life-cv-entry-form" class="space-y-4">
                    <input type="hidden" id="entry-id">
                    <div>
                        <label for="entry-type" class="block text-sm font-medium text-gray-700">Entry Type</label>
                        <select id="entry-type" class="w-full mt-1 p-2 border rounded-md">
                            <option value="experience">Experience (Formal/Informal)</option>
                            <option value="skill">Skill</option>
                            <option value="project">Project / Venture</option>
                            <option value="education">Education / Credential</option>
                            <option value="contribution">Community Contribution</option>
                        </select>
                    </div>
                    <div>
                        <label for="entry-title" class="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" id="entry-title" placeholder="e.g., Lead Developer, isiXhosa Conversation" class="w-full mt-1 p-2 border rounded-md" required>
                    </div>
                    <div>
                        <label for="entry-description" class="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="entry-description" rows="3" placeholder="Describe the experience, skill, or project." class="w-full mt-1 p-2 border rounded-md"></textarea>
                    </div>
                    <div class="flex justify-end gap-4">
                        <button type="button" id="cancel-entry-btn" class="btn bg-gray-200 text-gray-700">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Entry</button>
                    </div>
                </form>
            </div>

            <div id="cv-entries-list" class="space-y-4">
                <p class="text-center text-gray-500 py-8">Loading Life CV...</p>
            </div>
        </div>
    `;
    contentArea.innerHTML = html;
    attachLifeCvListeners(db, user);
    loadCvEntries(db, user);
}

function attachLifeCvListeners(db, user) {
    const addEntryBtn = document.getElementById('add-entry-btn');
    const entryFormContainer = document.getElementById('entry-form-container');
    const cancelBtn = document.getElementById('cancel-entry-btn');
    const entryForm = document.getElementById('life-cv-entry-form');

    addEntryBtn.addEventListener('click', () => {
        entryForm.reset();
        document.getElementById('entry-id').value = '';
        entryFormContainer.classList.remove('hidden');
        addEntryBtn.classList.add('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        entryFormContainer.classList.add('hidden');
        addEntryBtn.classList.remove('hidden');
        entryForm.reset();
    });

    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const entryId = document.getElementById('entry-id').value;
        const entryData = {
            type: document.getElementById('entry-type').value,
            title: document.getElementById('entry-title').value,
            description: document.getElementById('entry-description').value,
            releaseStatus: 'private', // Always default to private
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const userCvRef = db.collection('life_cvs').doc(user.uid);
            if (entryId) {
                await userCvRef.collection('entries').doc(entryId).update(entryData);
            } else {
                entryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await userCvRef.collection('entries').add(entryData);
            }
            
            entryFormContainer.classList.add('hidden');
            addEntryBtn.classList.remove('hidden');
            entryForm.reset();
            loadCvEntries(db, user);
        } catch (error) {
            console.error("Error saving entry: ", error);
            alert("Could not save entry.");
        }
    });
}

async function loadCvEntries(db, user) {
    const listContainer = document.getElementById('cv-entries-list');
    try {
        const entriesSnapshot = await db.collection('life_cvs').doc(user.uid).collection('entries').orderBy('createdAt', 'desc').get();
        if (entriesSnapshot.empty) {
            listContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Your Life CV is empty. Click "Add New Entry" to get started.</p>`;
            return;
        }

        let entriesHTML = '';
        entriesSnapshot.forEach(doc => {
            const entry = doc.data();
            const isChecked = entry.releaseStatus === 'approved';
            const isDisabled = entry.releaseStatus === 'pending';
            entriesHTML += `
                <div class="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                    <div>
                        <span class="text-xs font-semibold uppercase text-gray-500">${entry.type}</span>
                        <h4 class="font-bold text-dark">${entry.title}</h4>
                        <p class="text-sm text-gray-600">${entry.description}</p>
                    </div>
                    <div class="flex items-center gap-4">
                         <label class="flex items-center cursor-pointer" title="${getTooltipText(entry.releaseStatus)}">
                            <span class="text-sm mr-2">Public</span>
                            <div class="relative">
                                <input type="checkbox" class="public-toggle sr-only peer" data-id="${doc.id}" data-title="${entry.title}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:bg-yellow-200"></div>
                            </div>
                        </label>
                        <button class="edit-entry-btn text-gray-500 hover:text-primary" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-entry-btn text-gray-500 hover:text-red-500" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = entriesHTML;
        attachEntryActionListeners(db, user);

    } catch (error) {
        console.error("Error loading CV entries: ", error);
        listContainer.innerHTML = `<p class="text-center text-red-500 py-8">Could not load Life CV entries.</p>`;
    }
}

function attachEntryActionListeners(db, user) {
    const listContainer = document.getElementById('cv-entries-list');
    
    listContainer.addEventListener('change', async (e) => {
        if (e.target.classList.contains('public-toggle')) {
            const entryId = e.target.dataset.id;
            const entryTitle = e.target.dataset.title;
            const shouldBePublic = e.target.checked;

            if (shouldBePublic) {
                e.target.disabled = true;
                const success = await initiateReleaseRequest(db, user, entryId, entryTitle);
                if (!success) {
                    e.target.checked = false;
                    e.target.disabled = false;
                }
                loadCvEntries(db, user); // Refresh to show pending state
            } else {
                // Logic to retract public status
                await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).update({ releaseStatus: 'private' });
            }
        }
    });

    listContainer.addEventListener('click', async (e) => {
        const entryId = e.target.closest('button')?.dataset.id;
        if (!entryId) return;

        if (e.target.closest('.delete-entry-btn')) {
            if (confirm("Are you sure you want to delete this entry?")) {
                await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).delete();
                loadCvEntries(db, user);
            }
        }

        if (e.target.closest('.edit-entry-btn')) {
            const entryRef = await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).get();
            if (entryRef.exists) {
                const data = entryRef.data();
                document.getElementById('entry-id').value = entryId;
                document.getElementById('entry-type').value = data.type;
                document.getElementById('entry-title').value = data.title;
                document.getElementById('entry-description').value = data.description;
                document.getElementById('entry-form-container').classList.remove('hidden');
                document.getElementById('add-entry-btn').classList.add('hidden');
            }
        }
    });
}

function getTooltipText(status) {
    switch(status) {
        case 'pending': return 'This item is pending approval to be made public.';
        case 'approved': return 'This item is public.';
        case 'private': return 'Click to request to make this item public.';
        default: return '';
    }
}
