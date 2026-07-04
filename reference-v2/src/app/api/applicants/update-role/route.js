import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * V3 API Route: POST /api/applicants/update-role
 * Securely updates a user's role in the club database.
 * Only callable by authenticated admins/secretaries.
 * Body: { applicantId: string, role: string, callerToken: string }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { applicantId, role, callerToken } = body;

        // Validate input
        if (!applicantId || !role || !callerToken) {
            return NextResponse.json(
                { error: 'Missing required fields: applicantId, role, callerToken' },
                { status: 400 }
            );
        }

        const validRoles = ['member', 'technical', 'ops', 'data', 'secretary', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role value.' },
                { status: 400 }
            );
        }

        // Verify the caller session token
        const publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user }, error: authError } = await publicClient.auth.getUser(callerToken);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session token.' }, { status: 401 });
        }

        // Verify that the caller is an admin or secretary
        const serverClient = createServerSupabaseClient();
        const { data: callerData, error: callerError } = await serverClient
            .from('users')
            .select('role')
            .eq('uid', user.id)
            .single();

        if (callerError || !['admin', 'secretary'].includes(callerData?.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin or Secretary access required.' }, { status: 403 });
        }

        // Perform the role update
        const { data: updatedUser, error: updateError } = await serverClient
            .from('users')
            .update({ role })
            .eq('uid', applicantId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error('[API] update-role error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
