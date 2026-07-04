import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/register
 * Privileged server-side registration endpoint.
 * Creates the user in Supabase Auth (with email auto-confirmed to bypass email rate limits)
 * and inserts their profile row into the `users` table using the service role key.
 *
 * Body: { email, password, name, phone, branch, year, section, interests, reason }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name, phone, branch, year, section, interests, reason } = body;

        // Validate required fields
        if (!email || !password || !name || !branch || !year) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password, name, branch, and year are required.' },
                { status: 400 }
            );
        }

        const serverClient = createServerSupabaseClient();
        const safeEmail = email.trim().toLowerCase();

        // 1. Check if a profile already exists in the club database to prevent duplicates
        const { data: existingProfile, error: profileCheckError } = await serverClient
            .from('users')
            .select('uid')
            .eq('email', safeEmail)
            .maybeSingle();

        if (profileCheckError) throw profileCheckError;

        if (existingProfile) {
            return NextResponse.json(
                { error: 'This email is already registered in the database. Please go to the Login page.' },
                { status: 400 }
            );
        }

        // 2. Self-Healing: Check if the user exists in Supabase Auth but has no database profile (orphaned auth account)
        const { data: { users }, error: listError } = await serverClient.auth.admin.listUsers();
        if (listError) throw listError;

        const orphanedAuthUser = users?.find(u => u.email?.toLowerCase() === safeEmail);
        if (orphanedAuthUser) {
            console.log(`[API] Found orphaned auth record for ${safeEmail} (ID: ${orphanedAuthUser.id}). Deleting to allow clean re-registration...`);
            const { error: deleteError } = await serverClient.auth.admin.deleteUser(orphanedAuthUser.id);
            if (deleteError) throw deleteError;
        }

        // 3. Create the user in Auth with email auto-confirmed (bypasses Supabase email rate limits entirely)
        const { data: authData, error: authError } = await serverClient.auth.admin.createUser({
            email: safeEmail,
            password: password,
            email_confirm: true
        });

        if (authError) {
            console.error('[API] Auth user creation error:', authError);
            return NextResponse.json(
                { error: authError.message || 'Failed to create user credentials.' },
                { status: 400 }
            );
        }

        const newUser = authData.user;
        if (!newUser) throw new Error("Auth user created but no user object returned.");

        // 4. Insert the new profile row into the `users` table
        const { error: insertError } = await serverClient
            .from('users')
            .insert([{
                uid: newUser.id,
                email: safeEmail,
                role: 'applicant',
                name: name.trim(),
                phone: phone?.trim() || '',
                branch: branch,
                year: year,
                section: section?.trim() || '',
                interests: interests,
                reason: reason?.trim() || '',
                status: 'pending',
            }]);

        if (insertError) {
            console.error('[API] Database insert error:', insertError);
            // Clean up created auth user if db insert fails to prevent orphaned auth accounts
            await serverClient.auth.admin.deleteUser(newUser.id);
            return NextResponse.json(
                { error: insertError.message || 'Failed to save user profile.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[API] register error:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
