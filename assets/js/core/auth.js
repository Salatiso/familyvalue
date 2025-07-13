// This file will handle all Firebase authentication logic.

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
    db = firebase.firestore(); // Initialize Firestore
    
    if (callback) {
        callback(auth, db); // Pass auth and db instances back
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
            
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                
                // Create a user document in Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log("Signup successful:", userCredential.user);
                closeModal('signupModal');
                window.location.href = 'dashboard/index.html'; // Redirect after signup
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
                window.location.href = 'dashboard/index.html'; // Redirect after login
            } catch (error) {
                console.error("Login Error:", error.message);
                alert(`Login Failed: ${error.message}`);
            }
        }
    });
    
    // Use event delegation for provider sign-in buttons
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
            // If it's a new user, create their document in Firestore
            if (result.additionalUserInfo.isNewUser) {
                 await db.collection('users').doc(result.user.uid).set({
                    name: result.user.displayName,
                    email: result.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            console.log("Provider Sign-in successful");
            closeModal('loginModal');
            window.location.href = 'dashboard/index.html';
        } catch (error) {
             console.error("Provider Sign-in Error:", error.code, error.message);
             alert(`Sign-in Failed: ${error.message}`);
        }
    });
}

export function logout() {
    auth.signOut().catch(error => {
        console.error("Logout error:", error);
    });
}
