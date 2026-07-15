import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

const dbPath = path.join(process.cwd(), 'src', 'data', 'secretary_db.json');

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return { meetings: [], mails: [], points: {} };
    }
}

async function writeDb(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function authorizeRequest(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: 'Unauthorized: Missing or invalid token.' };
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return { authorized: false, error: 'Unauthorized: Invalid token session.' };
    }

    // Verify user role in public.users table
    const { data: profile, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('uid', user.id)
        .single();

    if (dbError || !profile) {
        return { authorized: false, error: 'Access Denied: User profile not found.' };
    }

    const allowedRoles = ['admin', 'secretary'];
    if (!allowedRoles.includes(profile.role)) {
        return { authorized: false, error: 'Access Denied: Insufficient privileges.' };
    }

    return { authorized: true, user };
}

export async function GET(request) {
    try {
        const auth = await authorizeRequest(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const db = await readDb();
        return NextResponse.json(db);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await authorizeRequest(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { type, action, data } = body;
        const db = await readDb();

        if (type === 'meeting') {
            if (action === 'create') {
                const newMeeting = {
                    id: `meeting-${Date.now()}`,
                    title: data.title,
                    date: data.date,
                    time: data.time,
                    description: data.description || '',
                    attendance: []
                };
                db.meetings.push(newMeeting);
            } else if (action === 'update-attendance') {
                const meeting = db.meetings.find(m => m.id === data.meetingId);
                if (meeting) {
                    meeting.attendance = data.attendanceList;
                }
            } else if (action === 'delete') {
                db.meetings = db.meetings.filter(m => m.id !== data.id);
            }
        } 
        
        else if (type === 'mail') {
            if (action === 'send') {
                const newMail = {
                    id: `mail-${Date.now()}`,
                    subject: data.subject,
                    body: data.body,
                    target: data.target || 'all',
                    date: new Date().toISOString().split('T')[0]
                };
                db.mails.unshift(newMail);
            } else if (action === 'delete') {
                db.mails = db.mails.filter(m => m.id !== data.id);
            }
        } 
        
        else if (type === 'points') {
            if (action === 'update') {
                const { userId, pointsChange, reason } = data;
                if (!db.points[userId]) {
                    db.points[userId] = {
                        total: 0,
                        history: []
                    };
                }
                db.points[userId].total += pointsChange;
                db.points[userId].history.unshift({
                    id: `history-${Date.now()}`,
                    pointsChange,
                    reason,
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }

        await writeDb(db);
        return NextResponse.json({ success: true, db });
    } catch (err) {
        console.error('[API] secretary db error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
