import { db } from "./firestore";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

/**
 * Fetch all applicants (users) from Firestore.
 * Sorts them on the client-side by createdAt (newest first) to avoid potential missing index errors.
 */
export async function fetchApplicants() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const applicants = [];
    querySnapshot.forEach((docSnap) => {
      applicants.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort newest first based on createdAt
    applicants.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    return applicants;
  } catch (error) {
    console.error("[dashboardService] Error fetching applicants:", error);
    throw error;
  }
}

/**
 * Generate the next sequential Member ID in the format RC-YY-NNNN.
 * Scans existing user documents to find the highest sequence number for the current 2-digit year.
 */
export async function generateNextMemberId() {
  try {
    const year2Digit = new Date().getFullYear().toString().slice(-2); // "26"
    const querySnapshot = await getDocs(collection(db, "users"));
    let maxSeq = 0;
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.memberId && typeof data.memberId === "string") {
        // Match pattern RC-YY-NNNN (e.g. RC-26-0001)
        const match = data.memberId.match(new RegExp(`^RC-${year2Digit}-(\\d{4})$`));
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });
    
    const nextSeq = maxSeq + 1;
    const paddedSeq = String(nextSeq).padStart(4, "0");
    return `RC-${year2Digit}-${paddedSeq}`;
  } catch (error) {
    console.error("[dashboardService] Error generating sequential member ID:", error);
    // Fallback ID if query fails
    const year2Digit = new Date().getFullYear().toString().slice(-2);
    return `RC-${year2Digit}-9999`;
  }
}

/**
 * Update an applicant's registration status in Firestore.
 * Isolates updates to status, role, memberId, and statusUpdatedAt timestamp.
 */
export async function updateApplicantStatus(uid, status, memberId = null) {
  try {
    const userRef = doc(db, "users", uid);
    const updates = {
      status: status,
      statusUpdatedAt: new Date().toISOString()
    };
    
    if (status === "accepted") {
      if (memberId) {
        updates.memberId = memberId;
      }
      updates.role = "member";
    } else if (status === "rejected") {
      updates.role = "member"; // Ensure role is member, not admin or anything
    }
    
    await updateDoc(userRef, updates);
    return true;
  } catch (error) {
    console.error("[dashboardService] Error updating applicant status:", error);
    throw error;
  }
}

/**
 * Update admin notes for an applicant in Firestore.
 */
export async function updateAdminNotes(uid, notes) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { adminNotes: notes });
    return true;
  } catch (error) {
    console.error("[dashboardService] Error updating admin notes:", error);
    throw error;
  }
}

/**
 * Fetch all events from Firestore.
 * Sorts them on the client-side by createdAt (newest first).
 */
export async function fetchEvents() {
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    const events = [];
    querySnapshot.forEach((docSnap) => {
      events.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort newest first based on date or createdAt
    events.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    return events;
  } catch (error) {
    console.error("[dashboardService] Error fetching events:", error);
    throw error;
  }
}
