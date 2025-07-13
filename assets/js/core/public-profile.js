// This script will be loaded on the public profile template pages.
// Its job is to fetch the correct user's data from Firestore and populate the page.

document.addEventListener('DOMContentLoaded', () => {
    // In a real application, the user's ID would be in the URL,
    // e.g., .../professional-minimalist.html?user=USER_ID
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');

    if (userId) {
        // Initialize Firebase connection (can be a lightweight version)
        // const db = firebase.firestore();
        // fetchAndRenderProfile(db, userId);
        console.log(`Fetching profile for user: ${userId}`);
        // For now, we'll just log this. The next phase would involve fetching from Firestore.
    } else {
        // Display a message if no user ID is provided
        const container = document.querySelector('.max-w-4xl.mx-auto');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h1 class="text-2xl font-bold">Profile Not Found</h1>
                    <p class="text-gray-600 mt-2">No user was specified. Please check the link and try again.</p>
                </div>
            `;
        }
    }
});

async function fetchAndRenderProfile(db, userId) {
    // This is the function that will connect to Firestore.
    // try {
    //     const docRef = db.collection('life_cvs').doc(userId);
    //     const doc = await docRef.get();

    //     if (doc.exists) {
    //         const data = doc.data();
    //         // Filter for entries where isPublic is true
    //         const publicEntries = data.entries.filter(entry => entry.isPublic);
            
    //         // Now, use this publicEntries array to populate the different sections
    //         // of the HTML template (e.g., header, experience, skills).
    //         console.log("Public profile data:", publicEntries);

    //     } else {
    //         console.log("No such document!");
    //         // Handle case where user profile doesn't exist
    //     }
    // } catch (error) {
    //     console.error("Error getting document:", error);
    // }
}
