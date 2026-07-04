import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * V3 API Route: POST /api/applicants/update-status
 * Securely accepts or rejects an applicant using the service role key.
 * Only callable by authenticated admins.
 * Body: { applicantId: string, status: 'accepted' | 'rejected', callerToken: string }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { applicantId, status, callerToken } = body;

        // Validate inputs
        if (!applicantId || !status || !callerToken) {
            return NextResponse.json(
                { error: 'Missing required fields: applicantId, status, callerToken' },
                { status: 400 }
            );
        }

        if (!['accepted', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be "accepted" or "rejected".' },
                { status: 400 }
            );
        }

        // Verify the caller is an authenticated admin using their session token
        const publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user }, error: authError } = await publicClient.auth.getUser(callerToken);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session token.' }, { status: 401 });
        }

        // Use the server client (service role) to verify the caller is an admin
        const serverClient = createServerSupabaseClient();
        const { data: callerData, error: callerError } = await serverClient
            .from('users')
            .select('role')
            .eq('uid', user.id)
            .single();

        if (callerError || !['admin', 'secretary'].includes(callerData?.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin or Secretary access required.' }, { status: 403 });
        }

        // Build the update payload
        const updates = { status };
        let memberId = null;

        if (status === 'accepted') {
            memberId = 'RC-' + Math.floor(1000 + Math.random() * 9000);
            updates.memberId = memberId;
            updates.role = 'member';
        }

        // Perform the update using the privileged server client
        const { data: updatedUser, error: updateError } = await serverClient
            .from('users')
            .update(updates)
            .eq('uid', applicantId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            memberId,
            user: updatedUser,
        });
    } catch (error) {
        console.error('[API] update-status error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
