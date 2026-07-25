import * as XLSX from "xlsx";

/**
 * Generates and triggers download of a 2-sheet attendance Excel workbook (.xlsx)
 * @param {Object} params
 * @param {Object} params.event - Event object ({ title, date })
 * @param {Array} params.checkpoints - List of checkpoint objects [{ id, checkpoint_name, checkpoint_order }]
 * @param {Array} params.members - Array of member profile objects [{ uid, name, memberId, roll_number }]
 * @param {Array} params.attendanceRecords - Raw attendance scan rows from event_attendance table
 */
export async function exportAttendanceExcel({ event, checkpoints = [], members = [], attendanceRecords = [] }) {
  const eventTitle = event?.title || "Robotics Event";
  const eventDate = event?.date || "TBD";
  const nowStr = new Date().toLocaleString();

  // Sort checkpoints by order
  const sortedCheckpoints = [...checkpoints].sort((a, b) => (a.checkpoint_order || 0) - (b.checkpoint_order || 0));

  // Map attendance by member_id and checkpoint_id
  // Structure: memberScanMap[member_id][checkpoint_id] = scanned_at
  const memberScanMap = {};
  const rawLogRows = [];

  attendanceRecords.forEach((record) => {
    const mId = record.member_id;
    const cId = record.checkpoint_id;
    const scannedAt = record.scanned_at ? new Date(record.scanned_at) : null;

    if (!memberScanMap[mId]) {
      memberScanMap[mId] = {};
    }
    memberScanMap[mId][cId] = scannedAt;

    // Build raw log row
    const memberObj = record.users || members.find((m) => m.uid === mId) || {};
    const checkpointObj = record.event_checkpoints || sortedCheckpoints.find((c) => c.id === cId) || {};

    rawLogRows.push({
      "Event Title": eventTitle,
      "Checkpoint": checkpointObj.checkpoint_name || record.checkpoint_name || "Checkpoint",
      "Member Name": memberObj.name || record.member_name || "Unknown Member",
      "RC Member ID": memberObj.memberId || memberObj.member_id || record.member_id_str || "N/A",
      "University Roll Number": memberObj.roll_number || record.roll_number || "N/A",
      "Scan Date": scannedAt ? scannedAt.toLocaleDateString() : "N/A",
      "Scan Time": scannedAt ? scannedAt.toLocaleTimeString() : "N/A",
      "Recorded By Admin": record.scanned_by || "System Admin",
    });
  });

  // SHEET 1: Attendance Summary Table Construction
  const summaryRows = [];

  // Metadata Headers
  summaryRows.push(["ROBOTICS CLUB V3 — OFFICIAL EVENT ATTENDANCE REPORT"]);
  summaryRows.push(["Event Title:", eventTitle]);
  summaryRows.push(["Event Date:", eventDate]);
  summaryRows.push(["Report Generated At:", nowStr]);
  summaryRows.push(["Total Checkpoints:", sortedCheckpoints.length]);
  summaryRows.push([]); // Empty spacing row

  // Table Header Columns
  const headerRow = [
    "S.No.",
    "Member Name",
    "RC Member ID",
    "University Roll Number",
    ...sortedCheckpoints.map((cp) => cp.checkpoint_name || "Checkpoint"),
    "Total Checkpoints Attended",
    "Attendance Percentage (%)",
  ];
  summaryRows.push(headerRow);

  // Filter members who attended at least 1 checkpoint or all registered members
  const memberListToExport = members.length > 0
    ? members
    : Object.keys(memberScanMap).map((mId) => {
        const firstRecord = attendanceRecords.find((r) => r.member_id === mId);
        return {
          uid: mId,
          name: firstRecord?.users?.name || "Member",
          memberId: firstRecord?.users?.memberId || "RC-MEMBER",
          roll_number: firstRecord?.users?.roll_number || "N/A",
        };
      });

  memberListToExport.forEach((m, idx) => {
    const scansForMember = memberScanMap[m.uid] || {};
    let attendedCount = 0;

    const checkpointTimestamps = sortedCheckpoints.map((cp) => {
      const scanDate = scansForMember[cp.id];
      if (scanDate) {
        attendedCount++;
        return `${scanDate.toLocaleDateString()} ${scanDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }
      return "—";
    });

    const totalCp = sortedCheckpoints.length || 1;
    const percentage = Math.round((attendedCount / totalCp) * 100);

    const getRollNumber = () => {
      if (m.roll_number) return m.roll_number;
      if (m.email && m.email.toLowerCase().startsWith("av.")) {
        return m.email.split("@")[0].toUpperCase();
      }
      return "N/A";
    };

    summaryRows.push([
      idx + 1,
      m.name || "Member",
      m.memberId || m.member_id || "N/A",
      getRollNumber(),
      ...checkpointTimestamps,
      `${attendedCount} / ${sortedCheckpoints.length}`,
      `${percentage}%`,
    ]);
  });

  // Create Workbook and Sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  
  // Set Column Widths for readability
  wsSummary["!cols"] = [
    { wch: 6 },  // S.No.
    { wch: 24 }, // Name
    { wch: 16 }, // RC ID
    { wch: 22 }, // Roll No.
    ...sortedCheckpoints.map(() => ({ wch: 22 })),
    { wch: 26 }, // Total Attended
    { wch: 24 }, // Percentage
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Attendance Summary");

  // Sheet 2: Raw Scan Audit Log
  const wsRaw = XLSX.utils.json_to_sheet(rawLogRows.length > 0 ? rawLogRows : [{ Info: "No scan audit records captured for this event." }]);
  wsRaw["!cols"] = [
    { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Scan Audit Log");

  // Generate clean filename
  const sanitizedTitle = eventTitle.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `RoboticsClub_${sanitizedTitle}_Attendance_${dateStr}.xlsx`;

  // Trigger Excel File Download
  XLSX.writeFile(wb, fileName);
}
