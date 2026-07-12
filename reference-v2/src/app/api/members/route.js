import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase/admin";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');
        
        if (memberId) {
            // Search by memberId
            const querySnapshot = await db.collection("users")
                .where("memberId", "==", memberId.trim())
                .get();
                
            const results = [];
            querySnapshot.forEach((docSnap) => {
                results.push({ uid: docSnap.id, ...docSnap.data() });
            });
            return NextResponse.json(results);
        }
        
        // Default: return all accepted members
        const querySnapshot = await db.collection("users")
            .where("status", "==", "accepted")
            .get();
            
        const members = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            members.push({
                uid: docSnap.id,
                name: data.name,
                role: data.role,
                email: data.email,
                status: data.status,
                branch: data.branch,
                year: data.year
            });
        });
        
        // Sort by name ascending
        members.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        
        return NextResponse.json(members);
    } catch (err) {
        console.error("Error in members API:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
