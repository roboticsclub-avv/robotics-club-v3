import { supabase } from "../supabase";

/**
 * Fetch all applicants (users) from Supabase.
 * Sorts them by createdAt (newest first).
 */
export async function fetchApplicants() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.uid,
      ...row
    }));
  } catch (error) {
    console.error("[supabase/dashboardService] Error fetching applicants:", error);
    throw error;
  }
}

/**
 * Generate the next sequential Member ID in the format RC-YY-NNN.
 * Scans existing user rows to find the highest sequence number for the current 2-digit year.
 */
export async function generateNextMemberId() {
  try {
    const year2Digit = new Date().getFullYear().toString().slice(-2); // "26"
    const { data, error } = await supabase
      .from('users')
      .select('memberId');

    if (error) throw error;

    let maxSeq = 0;
    
    (data || []).forEach((row) => {
      if (row.memberId && typeof row.memberId === "string") {
        // Match pattern RC-YY-NNNN (e.g. RC-26-0001)
        const match = row.memberId.match(new RegExp(`^RC-${year2Digit}-(\\d{4})$`));
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
    console.error("[supabase/dashboardService] Error generating sequential member ID:", error);
    const year2Digit = new Date().getFullYear().toString().slice(-2);
    return `RC-${year2Digit}-9999`;
  }
}

/**
 * Update an applicant's registration status in Supabase.
 */
export async function updateApplicantStatus(uid, status, memberId = null) {
  try {
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
      updates.role = "member";
    }
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[supabase/dashboardService] Error updating applicant status:", error);
    throw error;
  }
}

/**
 * Update admin notes for an applicant in Supabase.
 */
export async function updateAdminNotes(uid, notes) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ adminNotes: notes })
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[supabase/dashboardService] Error updating admin notes:", error);
    throw error;
  }
}

/**
 * Update a user's role in Supabase.
 */
export async function updateUserRole(uid, role) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: role })
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[supabase/dashboardService] Error updating user role:", error);
    throw error;
  }
}

/**
 * Delete a single user profile from Supabase.
 */
export async function deleteUser(uid) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[supabase/dashboardService] Error deleting user profile:", error);
    throw error;
  }
}

/**
 * Delete multiple user profiles from Supabase.
 */
export async function deleteBulkUsers(uidsArray) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .in('uid', uidsArray);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[supabase/dashboardService] Error bulk deleting users:", error);
    throw error;
  }
}

/**
 * Fetch all events from Supabase.
 * Sorts them by date (newest first).
 */
export async function fetchEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[supabase/dashboardService] Error fetching events:", error);
    throw error;
  }
}
