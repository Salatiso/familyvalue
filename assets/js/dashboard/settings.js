/*
    File: assets/js/dashboard/settings.js (New File)
    Description: Manages the settings page.
    Changes:
    - Provides a settings page structure.
    - Allows user to update their name.
    - Includes a language preference dropdown that saves the selection to the user's Firestore document.
    - Includes a section for notification preferences (UI only).
*/
import { translatePage } from '../core/i18n.js';

export async function renderSettingsView(contentArea, db, user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const primaryLang = userData.primaryLang || 'en';

    const languages = {
        'en': 'English', 'af': 'Afrikaans', 'fr': 'Français', 'nd': 'isiNdebele', 
        'nso': 'Sepedi', 'pt': 'Português', 'sn': 'chiShona', 'ss': 'siSwati', 
        'st': 'Sesotho', 'sw': 'Kiswahili', 'tn': 'Setswana', 'ts': 'Xitsonga', 
        've': 'Tshivenḓa', 'xh': 'isiXhosa', 'zu': 'isiZulu'
    };

    const langOptions = Object.entries(languages).map(([code, name]) => 
        `<option value="${code}" ${code === primaryLang ? 'selected' : ''}>${name}</option>`
    ).join('');

    contentArea.innerHTML = `
        <div class="dashboard-view active" id="settings-view">
            <h1 class="text-3xl font-bold text-dark mb-8" data-i18n="settings.title">Settings</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 space-y-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4" data-i18n="settings.account.title">Account Information</h2>
                        <form id="account-settings-form" class="space-y-4">
                            <div><label for="setting-name" class="block text-sm font-medium text-gray-700" data-i18n="settings.account.name">Full Name</label><input type="text" id="setting-name" value="${user.displayName || ''}" class="mt-1 block w-full form-input"></div>
                            <div><label for="setting-email" class="block text-sm font-medium text-gray-700" data-i18n="settings.account.email">Email Address</label><input type="email" id="setting-email" value="${user.email || ''}" class="mt-1 block w-full form-input bg-gray-100" disabled><p class="text-xs text-gray-500 mt-1" data-i18n="settings.account.email_note">Email cannot be changed.</p></div>
                            <div class="text-right"><button type="submit" class="btn btn-primary" data-i18n="common.update_account">Update Account</button></div>
                        </form>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4" data-i18n="settings.language.title">Language Preference</h2>
                        <p class="text-sm text-gray-600 mb-4" data-i18n="settings.language.subtitle">Choose your primary language for the platform.</p>
                        <select id="language-preference-select" class="w-full form-input">${langOptions}</select>
                    </div>
                </div>
                <div class="md:col-span-1">
                     <div class="bg-white p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-dark mb-4" data-i18n="settings.notifications.title">Notifications</h2>
                        <div class="space-y-4">
                            <label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-primary rounded" checked><span class="ml-2 text-gray-700" data-i18n="settings.notifications.email_updates">Email me with product updates.</span></label>
                            <label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-primary rounded" checked><span class="ml-2 text-gray-700" data-i18n="settings.notifications.family_activity">Notify me of family activity.</span></label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('account-settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('setting-name').value;
        try {
            await user.updateProfile({ displayName: newName });
            await db.collection('users').doc(user.uid).update({ name: newName });
            openModal('successModal');
        } catch (error) { console.error("Error updating profile:", error); }
    });

    document.getElementById('language-preference-select').addEventListener('change', async (e) => {
        const newLang = e.target.value;
        try {
            await db.collection('users').doc(user.uid).update({ primaryLang: newLang });
            await translatePage(newLang); // Re-translate the current page
            openModal('successModal');
        } catch (error) { console.error("Error updating language preference:", error); }
    });
}
