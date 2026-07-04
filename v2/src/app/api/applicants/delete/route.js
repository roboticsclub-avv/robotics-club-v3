import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * V3 API Route: POST /api/applicants/delete
 * Securely deletes an applicant record using the service role key.
 * Only callable by authenticated admins.
 * Body: { applicantId: string, callerToken: string }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { applicantId, callerToken } = body;

        if (!applicantId || !callerToken) {
            return NextResponse.json(
                { error: 'Missing required fields: applicantId, callerToken' },
                { status: 400 }
            );
        }

        // Verify caller session
        const publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user }, error: authError } = await publicClient.auth.getUser(callerToken);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session token.' }, { status: 401 });
        }

        // Verify admin role via server client
        const serverClient = createServerSupabaseClient();
        const { data: callerData, error: callerError } = await serverClient
            .from('users')
            .select('role')
            .eq('uid', user.id)
            .single();

        if (callerError || !['admin', 'secretary'].includes(callerData?.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin or Secretary access required.' }, { status: 403 });
        }

        // Delete the record using the privileged server client
        const { error: deleteError } = await serverClient
            .from('users')
            .delete()
            .eq('uid', applicantId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] delete-applicant error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
