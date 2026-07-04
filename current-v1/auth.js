import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Generate a random Member ID (RC-XXXX)
function generateMemberId() {
    return 'RC-' + Math.floor(1000 + Math.random() * 9000);
}

// Sign Up Function
export async function registerUser(email, password, additionalData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user details in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            memberId: 'PENDING', // ID will be assigned by Admin
            role: 'member',
            name: additionalData.name,
            phone: additionalData.phone || '',
            branch: additionalData.branch,
            year: additionalData.year,
            section: additionalData.section || '',
            interests: additionalData.interests,
            reason: additionalData.reason || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        await signOut(auth); // Sign out immediately
        return true; // Return success to let the UI handle feedback
    } catch (error) {
        console.error("Error registering user:", error);
        throw error; // Rethrow to be caught by the UI
    }
}

// Login Function
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check user status in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.role === 'admin') {
                window.location.href = 'dashboard.html';
                return;
            }

            if (userData.status === 'pending') {
                await signOut(auth);
                alert("Access Denied: Your application is still PENDING approval.");
                return;
            } else if (userData.status === 'rejected') {
                await signOut(auth);
                alert("Access Denied: Your application was rejected.");
                return;
            }

            // If accepted/approved
            window.location.href = 'index.html';
        } else {
            // Doc missing?
            await signOut(auth);
            alert("Error: User profile not found.");
        }

    } catch (error) {
        console.error("Error logging in:", error);
        alert("Login Failed: " + error.message);
    }
}

// Logout Function
export async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

// Monitor Auth State
export function monitorAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user);
        } else {
            callback(null);
        }
    });
}

// Check Admin Access (for Dashboard)
export async function checkAdminAccess() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                // Allowed
                console.log("Admin access granted.");
            } else {
                alert("Access Denied: You are not an admin.");
                window.location.href = 'login.html';
            }
        } else {
            window.location.href = 'login.html';
        }
    });
}
