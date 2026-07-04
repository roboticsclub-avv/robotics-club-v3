import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, orderBy, query, limit, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Create Event
export async function createEvent(eventData) {
    try {
        await addDoc(collection(db, "events"), {
            ...eventData,
            createdAt: new Date().toISOString()
        });
        alert("Event Created Successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Error creating event:", error);
        alert("Failed to create event: " + error.message);
    }
}

// Get Upcoming Events
export async function getUpcomingEvents() {
    try {
        const q = query(collection(db, "events"), orderBy("date", "asc"), limit(3));
        const querySnapshot = await getDocs(q);
        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        return events;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}
// Get All Events (for Admin)
export async function getAllEvents() {
    try {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        return events;
    } catch (error) {
        console.error("Error fetching all events:", error);
        return [];
    }
}

// Delete Event
export async function deleteEvent(eventId) {
    try {
        await deleteDoc(doc(db, "events", eventId));
        return true;
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
}

// Update Event
export async function updateEvent(eventId, eventData) {
    try {
        await updateDoc(doc(db, "events", eventId), {
            ...eventData,
            updatedAt: new Date().toISOString()
        });
        alert("Event Updated Successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Error updating event:", error);
        alert("Failed to update event: " + error.message);
    }
}
