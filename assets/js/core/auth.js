/*
    File: assets/js/core/auth.js
    Description: Handles all Firebase authentication, including the new Terms & Conditions flow.
    Changes:
    - Replaced all `alert()` calls with `showAuthMessage()`.
    - Added a `terms_and_conditions.html` modal check.
    - After login/signup, checks if the user has accepted the terms. If not, it shows the T&C modal.
    - Redirect to dashboard only occurs after terms are accepted.
    - Stores `termsAccepted` flag in the user's Firestore document.
    - Added Date of Birth to the signup process.
*/
const firebaseConfig = {
    apiKey: "AIzaSyDDnhxpeaKf_5GI2QMitmgdavCpTh-si30",
    authDomain: "familyvalue-26fee.firebaseapp.com",
    projectId: "familyvalue-26fee",
    storageBucket: "familyvalue-26fee.appspot.com",
    messagingSenderId: "396700596960",
    appId: "1:396700596960:web:7c3c06b6554f0d82652e85",
    measurementId: "G-T3F6F1MFXB"
};

let app;
let auth;
let db;

export function initializeAuth(callback) {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
    if (callback) {
        callback(auth, db);
    }
    setupAuthListeners();
}

export function onAuthChange(authInstance, callback) {
    authInstance.onAuthStateChanged(callback);
}

function setupAuthListeners() {
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'signup-form') {
            e.preventDefault();
            const name = e.target.name.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            const dob = e.target.dob.value;

            if (!name || !email || !password || !dob) {
                showAuthMessage('signup-message', 'Please fill in all fields.', true);
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    dob: dob,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    termsAccepted: false,
                    primaryLang: 'en' // Default language
                });

                console.log("Signup successful, proceeding to T&C check:", userCredential.user);
                closeModal('signupModal');
                await checkTermsAndRedirect(userCredential.user);

            } catch (error) {
                console.error("Signup Error:", error.message);
                showAuthMessage('signup-message', `Signup Failed: ${error.message}`, true);
            }
        }

        if (e.target && e.target.id === 'login-form') {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log("Login successful, proceeding to T&C check:", userCredential.user);
                closeModal('loginModal');
                await checkTermsAndRedirect(userCredential.user);
            } catch (error) {
                console.error("Login Error:", error.message);
                showAuthMessage('login-message', `Login Failed: ${error.message}`, true);
            }
        }
    });
    
    document.addEventListener('click', async (e) => {
        let provider;
        if (e.target.closest('#google-signin-btn')) {
            provider = new firebase.auth.GoogleAuthProvider();
        } else if (e.target.closest('#apple-signin-btn')) {
            provider = new firebase.auth.OAuthProvider('apple.com');
        } else {
            return;
        }

        try {
            const result = await auth.signInWithPopup(provider);
            if (result.additionalUserInfo.isNewUser) {
                 await db.collection('users').doc(result.user.uid).set({
                    name: result.user.displayName,
                    email: result.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    termsAccepted: false,
                    primaryLang: 'en'
                }, { merge: true });
            }
            console.log("Provider Sign-in successful");
            closeModal('loginModal');
            await checkTermsAndRedirect(result.user);
        } catch (error) {
             console.error("Provider Sign-in Error:", error.code, error.message);
             showAuthMessage('login-message', `Sign-in Failed: ${error.message}`, true);
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.id === 'accept-terms-btn') {
            const user = auth.currentUser;
            if (user) {
                await db.collection('users').doc(user.uid).update({ termsAccepted: true });
                closeModal('termsModal');
                window.location.href = '/familyvalue/dashboard/index.html';
            }
        }
        if (e.target.id === 'decline-terms-btn') {
            closeModal('termsModal');
            logout();
        }
    });
}

async function checkTermsAndRedirect(user) {
    if (!user) return;
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data().termsAccepted === true) {
        window.location.href = '/familyvalue/dashboard/index.html';
    } else {
        openModal('termsModal');
    }
}

function showAuthMessage(elementId, message, isError = false) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = isError ? 'text-red-500 text-sm mt-2 text-center' : 'text-green-500 text-sm mt-2 text-center';
        messageEl.style.display = 'block';
    }
}

export function logout() {
    auth.signOut().then(() => {
        window.location.href = '/familyvalue/index.html';
    }).catch(error => {
        console.error("Logout error:", error);
    });
}
