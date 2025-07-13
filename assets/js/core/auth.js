// This file will handle all Firebase authentication logic.

// --- Firebase Configuration ---
// IMPORTANT: In a real-world application, these keys should be stored in environment variables
// and not be hardcoded directly in the source code for security reasons.
const firebaseConfig = {
    apiKey: "AIzaSyDDnhxpeaKf_5GI2QMitmgdavCpTh-si30",
    authDomain: "familyvalue-26fee.firebaseapp.com",
    projectId: "familyvalue-26fee",
    storageBucket: "familyvalue-26fee.appspot.com",
    messagingSenderId: "396700596960",
    appId: "1:396700596960:web:7c3c06b6554f0d82652e85",
    measurementId: "G-T3F6F1MFXB"
};

// --- Initialize Firebase ---
let app;
let auth;

export function initializeAuth() {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    auth = firebase.auth();
    setupAuthListeners();
}

function setupAuthListeners() {
    // Listen for authentication state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            console.log("User is signed in:", user);
            updateUIAfterLogin(user);
        } else {
            // User is signed out.
            console.log("User is signed out.");
            updateUIAfterLogout();
        }
    });

    // --- EVENT LISTENERS FOR AUTH FORMS ---
    // Note: These forms will be loaded into the DOM via modals.
    // We use event delegation on the document to ensure listeners are attached.
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'signup-form') {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                console.log("Signup successful:", userCredential.user);
                closeModal('signupModal');
            } catch (error) {
                console.error("Signup Error:", error.message);
                alert(`Signup Failed: ${error.message}`);
            }
        }

        if (e.target && e.target.id === 'login-form') {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log("Login successful:", userCredential.user);
                closeModal('loginModal');
            } catch (error) {
                console.error("Login Error:", error.message);
                alert(`Login Failed: ${error.message}`);
            }
        }
    });
    
    // Google Sign-In
    const googleBtn = document.getElementById('google-signin-btn');
    if(googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
            } catch (error) {
                 console.error("Google Sign-in Error:", error.message);
                 alert(`Google Sign-in Failed: ${error.message}`);
            }
        });
    }
}

function updateUIAfterLogin(user) {
    // Redirect to the dashboard or update the UI to show user is logged in
    window.location.href = 'dashboard/index.html';
}

function updateUIAfterLogout() {
    // This function can be used to update the header to show "Login/Signup" buttons
    // if the user logs out while on the page.
    // For now, we handle this on page load.
}

// Export a logout function to be used in the dashboard
export function logout() {
    auth.signOut().catch(error => {
        console.error("Logout error:", error);
    });
}
