// This script will manage the Life CV section of the dashboard.
// It will handle adding, editing, and deleting entries, and saving them to Firestore.

// This function will be called by dashboard-main.js to render the Life CV view.
export function renderLifeCvView(contentArea) {
    const html = `
        <div class="dashboard-view active" id="life-cv-view">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-dark">My Life CV</h1>
                <button id="add-entry-btn" class="btn btn-primary"><i class="fas fa-plus mr-2"></i>Add New Entry</button>
            </div>
            
            <p class="text-gray-600 mb-6">This is your private, central repository of all skills, experiences, projects, and credentials. Information here is only made public on your profile page if you explicitly choose to release it.</p>

            <!-- Entry Form (hidden by default) -->
            <div id="entry-form-container" class="bg-white p-6 rounded-lg shadow-md mb-8 hidden">
                <h2 class="text-xl font-bold text-dark mb-4">New CV Entry</h2>
                <form id="life-cv-entry-form" class="space-y-4">
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
                        <input type="text" id="entry-title" placeholder="e.g., Lead Developer, isiXhosa Conversation, OHS Safety Plan" class="w-full mt-1 p-2 border rounded-md">
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

            <!-- List of CV Entries -->
            <div id="cv-entries-list" class="space-y-4">
                <p class="text-center text-gray-500 py-8">Your Life CV is empty. Click "Add New Entry" to get started.</p>
                <!-- Entries will be loaded here from Firestore -->
            </div>
        </div>
    `;
    contentArea.innerHTML = html;
    attachLifeCvListeners();
}

function attachLifeCvListeners() {
    const addEntryBtn = document.getElementById('add-entry-btn');
    const entryFormContainer = document.getElementById('entry-form-container');
    const cancelBtn = document.getElementById('cancel-entry-btn');
    const entryForm = document.getElementById('life-cv-entry-form');

    addEntryBtn.addEventListener('click', () => {
        entryFormContainer.classList.remove('hidden');
        addEntryBtn.classList.add('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        entryFormContainer.classList.add('hidden');
        addEntryBtn.classList.remove('hidden');
        entryForm.reset();
    });

    entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Logic to save data to Firestore will go here
        const newEntry = {
            type: document.getElementById('entry-type').value,
            title: document.getElementById('entry-title').value,
            description: document.getElementById('entry-description').value,
            date: new Date(),
            isPublic: false // Default to private
        };
        console.log("Saving new entry:", newEntry);
        // In a real app, you would call a function like saveEntryToFirestore(newEntry)
        
        // After saving, hide form and refresh list
        entryFormContainer.classList.add('hidden');
        addEntryBtn.classList.remove('hidden');
        entryForm.reset();
        // Then call a function to refresh the displayed list of entries
        // loadCvEntries(); 
    });
}

// Placeholder for function to load entries from Firestore
async function loadCvEntries() {
    // 1. Get current user's ID
    // 2. Query Firestore for `/life_cvs/{userId}/entries`
    // 3. Render the entries into the #cv-entries-list container
}
