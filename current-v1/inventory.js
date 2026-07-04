import { db } from './firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Hardware Inventory Functions
export const addHardware = async (item) => {
    try {
        const docRef = await addDoc(collection(db, "inventory"), {
            ...item,
            totalQuantity: Number(item.totalQuantity),
            availableQuantity: Number(item.totalQuantity),
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding hardware: ", e);
        throw e;
    }
};

export const updateHardware = async (id, item) => {
    try {
        const docRef = doc(db, "inventory", id);
        await updateDoc(docRef, {
            ...item,
            totalQuantity: Number(item.totalQuantity),
            availableQuantity: Number(item.availableQuantity),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error updating hardware: ", e);
        throw e;
    }
};

export const deleteHardware = async (id) => {
    try {
        await deleteDoc(doc(db, "inventory", id));
    } catch (e) {
        console.error("Error deleting hardware: ", e);
        throw e;
    }
};

export const getAllHardware = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const inventory = [];
        querySnapshot.forEach((docSnap) => {
            inventory.push({ id: docSnap.id, ...docSnap.data() });
        });
        return inventory;
    } catch (e) {
        console.error("Error getting hardware: ", e);
        throw e;
    }
};

// Allocation Functions
export const issueHardware = async (allocation) => {
    try {
        // 1. Create allocation record
        const allocationRef = await addDoc(collection(db, "allocations"), {
            userId: allocation.userId,
            userName: allocation.userName,
            memberId: allocation.memberId,
            itemId: allocation.itemId,
            itemName: allocation.itemName,
            expectedReturn: allocation.expectedReturn,
            status: 'issued',
            issuedAt: serverTimestamp()
        });

        // 2. Decrement available quantity in inventory
        const inventoryRef = doc(db, "inventory", allocation.itemId);
        await updateDoc(inventoryRef, {
            availableQuantity: increment(-1)
        });

        return allocationRef.id;
    } catch (e) {
        console.error("Error issuing hardware: ", e);
        throw e;
    }
};

export const returnHardware = async (allocationId, itemId) => {
    try {
        // 1. Update allocation status
        const allocationRef = doc(db, "allocations", allocationId);
        await updateDoc(allocationRef, {
            status: 'returned',
            returnedAt: serverTimestamp()
        });

        // 2. Increment available quantity in inventory
        const inventoryRef = doc(db, "inventory", itemId);
        await updateDoc(inventoryRef, {
            availableQuantity: increment(1)
        });
    } catch (e) {
        console.error("Error returning hardware: ", e);
        throw e;
    }
};

export const getAllAllocations = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "allocations"));
        const allocations = [];
        querySnapshot.forEach((docSnap) => {
            allocations.push({ id: docSnap.id, ...docSnap.data() });
        });
        return allocations;
    } catch (e) {
        console.error("Error getting allocations: ", e);
        throw e;
    }
};

// Member Lookup
export const findMemberByMemberId = async (memberId) => {
    try {
        const q = query(collection(db, "users"), where("memberId", "==", memberId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
    } catch (e) {
        console.error("Error finding member: ", e);
        throw e;
    }
};
