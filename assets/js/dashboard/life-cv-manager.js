/*
    File: assets/js/dashboard/life-cv-manager.js
    Description: Manages the "My Life CV" page.
    Changes:
    - Added a new "Personal Information" form which saves to the user's document.
    - Added a "CV Upload" section with a file input.
    - Included `pdf.js` and `mammoth.js` via CDN to parse uploaded files.
    - Replaced `confirm()` with the new `openConfirmationModal()`.
    - Added logic to handle file parsing and creating a new CV entry from the text.
*/
import { initiateReleaseRequest } from './release-protocol.js';
import { translatePage } from '../core/i18n.js';

function loadParserScripts() {
    if (!document.getElementById('pdf-js-script')) {
        const pdfScript = document.createElement('script');
        pdfScript.id = 'pdf-js-script';
        pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
        document.head.appendChild(pdfScript);
        // Set worker source for pdf.js
        pdfScript.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
        };
    }
    if (!document.getElementById('mammoth-js-script')) {
        const mammothScript = document.createElement('script');
        mammothScript.id = 'mammoth-js-script';
        mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.18/mammoth.browser.min.js';
        document.head.appendChild(mammothScript);
    }
}

export async function renderLifeCvView(contentArea, db, user) {
    loadParserScripts();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    contentArea.innerHTML = `
        <div class="dashboard-view active" id="life-cv-view">
            <h1 class="text-3xl font-bold text-dark mb-8" data-i18n="cv.title"></h1>

            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 class="text-xl font-bold text-dark mb-4" data-i18n="cv.personal_info.title"></h2>
                <form id="personal-info-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label for="pi-name" class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.name"></label><input type="text" id="pi-name" value="${userData.name || ''}" class="mt-1 block w-full form-input"></div>
                    <div><label for="pi-dob" class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.dob"></label><input type="date" id="pi-dob" value="${userData.dob || ''}" class="mt-1 block w-full form-input"></div>
                    <div><label for="pi-contact" class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.contact"></label><input type="tel" id="pi-contact" value="${userData.contactNumber || ''}" class="mt-1 block w-full form-input"></div>
                    <div><label for="pi-id" class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.id_number"></label><input type="text" id="pi-id" value="${userData.identityNumber || ''}" class="mt-1 block w-full form-input"></div>
                    <div class="md:col-span-2"><label for="pi-address" class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.address"></label><textarea id="pi-address" rows="3" class="mt-1 block w-full form-input">${userData.address || ''}</textarea></div>
                    <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700" data-i18n="cv.personal_info.socials"></label><input type="url" id="pi-linkedin" value="${userData.linkedin || ''}" class="mt-1 block w-full form-input" placeholder="LinkedIn Profile URL"></div>
                    <div class="md:col-span-2 text-right"><button type="submit" class="btn btn-primary" data-i18n="common.save_changes"></button></div>
                </form>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 class="text-xl font-bold text-dark mb-4" data-i18n="cv.upload.title"></h2>
                <p class="text-sm text-gray-600 mb-4" data-i18n="cv.upload.subtitle"></p>
                <div class="flex items-center gap-4"><input type="file" id="cv-upload-input" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept=".pdf,.doc,.docx"><button id="process-cv-btn" class="btn btn-secondary" data-i18n="cv.upload.process_btn"></button></div>
                <div id="cv-parse-spinner" class="hidden text-center mt-4"><i class="fas fa-spinner fa-spin text-2xl text-primary"></i><p data-i18n="cv.upload.processing" class="mt-2"></p></div>
            </div>

            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-dark" data-i18n="cv.entries.title"></h2>
                <button id="add-entry-btn" class="btn btn-primary"><i class="fas fa-plus mr-2"></i><span data-i18n="cv.entries.add_btn"></span></button>
            </div>
            
            <div id="entry-form-container" class="bg-white p-6 rounded-lg shadow-md mb-8 hidden">
                <h2 class="text-xl font-bold text-dark mb-4">New CV Entry</h2>
                <form id="life-cv-entry-form" class="space-y-4">
                    <input type="hidden" id="entry-id">
                    <div><label for="entry-type" class="block text-sm font-medium text-gray-700">Entry Type</label><select id="entry-type" class="w-full mt-1 p-2 border rounded-md"><option value="experience">Experience</option><option value="skill">Skill</option><option value="project">Project</option><option value="education">Education</option><option value="contribution">Contribution</option></select></div>
                    <div><label for="entry-title" class="block text-sm font-medium text-gray-700">Title</label><input type="text" id="entry-title" class="w-full mt-1 p-2 border rounded-md" required></div>
                    <div><label for="entry-description" class="block text-sm font-medium text-gray-700">Description</label><textarea id="entry-description" rows="3" class="w-full mt-1 p-2 border rounded-md"></textarea></div>
                    <div class="flex justify-end gap-4"><button type="button" id="cancel-entry-btn" class="btn bg-gray-200 text-gray-700">Cancel</button><button type="submit" class="btn btn-primary">Save Entry</button></div>
                </form>
            </div>

            <div id="cv-entries-list" class="space-y-4">
                <p class="text-center text-gray-500 py-8" data-i18n="common.loading"></p>
            </div>
        </div>
    `;
    translatePage(localStorage.getItem('familyValueLang') || 'en');
    attachLifeCvListeners(db, user);
    loadCvEntries(db, user);
}

function attachLifeCvListeners(db, user) {
    document.getElementById('personal-info-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataToSave = {
            name: document.getElementById('pi-name').value,
            dob: document.getElementById('pi-dob').value,
            contactNumber: document.getElementById('pi-contact').value,
            identityNumber: document.getElementById('pi-id').value,
            address: document.getElementById('pi-address').value,
            linkedin: document.getElementById('pi-linkedin').value,
        };
        try {
            await db.collection('users').doc(user.uid).set(dataToSave, { merge: true });
            openModal('successModal');
        } catch (error) { console.error("Error saving personal info:", error); }
    });

    document.getElementById('process-cv-btn').addEventListener('click', () => handleCvUpload(db, user));

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
            releaseStatus: 'private',
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
        } catch (error) { console.error("Error saving entry: ", error); }
    });
}

async function handleCvUpload(db, user) {
    const fileInput = document.getElementById('cv-upload-input');
    const spinner = document.getElementById('cv-parse-spinner');
    if (fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    spinner.classList.remove('hidden');
    let textContent = '';

    try {
        if (file.type === "application/pdf") {
            const pdf = await window.pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map(item => item.str).join(' ');
            }
        } else if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            textContent = result.value;
        } else { throw new Error("Unsupported file type."); }

        const entryData = {
            type: 'contribution',
            title: `CV Uploaded: ${file.name}`,
            description: textContent.substring(0, 5000),
            releaseStatus: 'private',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('life_cvs').doc(user.uid).collection('entries').add(entryData);
        loadCvEntries(db, user);
        openModal('successModal');
    } catch (error) {
        console.error("Error processing CV:", error);
    } finally {
        spinner.classList.add('hidden');
        fileInput.value = '';
    }
}

async function loadCvEntries(db, user) {
    const listContainer = document.getElementById('cv-entries-list');
    try {
        const entriesSnapshot = await db.collection('life_cvs').doc(user.uid).collection('entries').orderBy('createdAt', 'desc').get();
        if (entriesSnapshot.empty) {
            listContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Your Life CV is empty. Click "Add New Entry" to get started.</p>`;
            return;
        }
        listContainer.innerHTML = entriesSnapshot.docs.map(doc => {
            const entry = doc.data();
            const isChecked = entry.releaseStatus === 'approved';
            const isDisabled = entry.releaseStatus === 'pending';
            return `
                <div class="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                    <div>
                        <span class="text-xs font-semibold uppercase text-gray-500">${entry.type}</span>
                        <h4 class="font-bold text-dark">${entry.title}</h4>
                        <p class="text-sm text-gray-600">${entry.description}</p>
                    </div>
                    <div class="flex items-center gap-4">
                         <label class="flex items-center cursor-pointer" title="${getTooltipText(entry.releaseStatus)}">
                            <span class="text-sm mr-2">Public</span>
                            <div class="relative"><input type="checkbox" class="public-toggle sr-only peer" data-id="${doc.id}" data-title="${entry.title}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}><div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:bg-yellow-200"></div></div>
                        </label>
                        <button class="edit-entry-btn text-gray-500 hover:text-primary" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-entry-btn text-gray-500 hover:text-red-500" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        }).join('');
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
            if (e.target.checked) {
                e.target.disabled = true;
                const success = await initiateReleaseRequest(db, user, entryId, entryTitle);
                if (!success) { e.target.checked = false; e.target.disabled = false; }
                loadCvEntries(db, user);
            } else {
                await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).update({ releaseStatus: 'private' });
            }
        }
    });

    listContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const entryId = button.dataset.id;
        if (!entryId) return;

        if (button.classList.contains('delete-entry-btn')) {
            openConfirmationModal('Delete Entry?', 'Are you sure you want to permanently delete this entry? This action cannot be undone.',
                async () => {
                    await db.collection('life_cvs').doc(user.uid).collection('entries').doc(entryId).delete();
                    loadCvEntries(db, user);
                }
            );
        }

        if (button.classList.contains('edit-entry-btn')) {
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
        case 'pending': return 'This item is pending approval.';
        case 'approved': return 'This item is public.';
        case 'private': return 'Click to request to make this item public.';
        default: return '';
    }
}
