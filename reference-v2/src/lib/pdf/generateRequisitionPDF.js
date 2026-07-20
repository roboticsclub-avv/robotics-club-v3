/**
 * Client-Side PDF Generator for Hardware Requisition Form
 * Robotics Club AVV Website V3
 */

export async function generateRequisitionPDF(requestData, itemsData) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const primaryColor = [79, 70, 229]; // Indigo #4F46E5
    const darkTextColor = [30, 41, 59]; // Slate 800
    const lightBgColor = [248, 250, 252]; // Slate 50

    // Header Banner
    doc.setFillColor(15, 23, 42); // Dark Navy #0F172A
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ROBOTICS CLUB AVV", 14, 16);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("HARDWARE REQUISITION FORM", 14, 24);

    // Temp Request ID Badge
    doc.setFillColor(...primaryColor);
    doc.roundedRect(125, 10, 70, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TEMPORARY REQUEST ID", 129, 16);
    doc.setFontSize(11);
    doc.text(requestData.temp_request_id || "REQ-TEMP-2026", 129, 23);

    let currentY = 43;

    // Helper: Section Title Header
    const drawSectionHeader = (title, y) => {
      doc.setFillColor(...lightBgColor);
      doc.rect(14, y, 182, 8, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 8, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text(title.toUpperCase(), 18, y + 5.5);
      return y + 12;
    };

    // 1. Applicant Details
    currentY = drawSectionHeader("1. Applicant Details", currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...darkTextColor);

    const applicantFields = [
      ["Applicant Name:", requestData.user_name || "N/A", "Member ID:", requestData.member_id || "N/A"],
      ["Roll Number:", requestData.roll_number || "N/A", "Department:", requestData.department || "N/A"],
      ["Section / Year:", `${requestData.section || "-"} / Year ${requestData.year || "-"}`, "Email:", requestData.email || "N/A"],
      ["Phone Number:", requestData.phone || "N/A", "Submission Date:", new Date().toLocaleDateString("en-IN")],
    ];

    applicantFields.forEach((row) => {
      doc.setFont("helvetica", "bold");
      doc.text(row[0], 18, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(row[1], 55, currentY);

      doc.setFont("helvetica", "bold");
      doc.text(row[2], 110, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(row[3], 145, currentY);
      currentY += 6;
    });

    currentY += 2;

    // 2. Project Information
    currentY = drawSectionHeader("2. Project Information", currentY);

    const projectFields = [
      ["Project Title:", requestData.project_title || "N/A"],
      ["Project Type:", requestData.project_type || "N/A"],
      ["Faculty Mentor:", requestData.faculty_mentor || "N/A (Not Assigned)"],
      ["Purpose of Hardware:", requestData.purpose || "N/A"],
      ["Expected Outcome:", requestData.expected_outcome || "N/A"],
    ];

    projectFields.forEach((row) => {
      doc.setFont("helvetica", "bold");
      doc.text(row[0], 18, currentY);
      doc.setFont("helvetica", "normal");
      
      const splitText = doc.splitTextToSize(row[1], 135);
      doc.text(splitText, 55, currentY);
      currentY += Math.max(splitText.length * 5, 6);
    });

    currentY += 2;

    // 3. Hardware Items Table
    currentY = drawSectionHeader("3. Requested Hardware Components", currentY);

    const tableHeaders = [["#", "Category", "Component Name", "Qty", "Remarks"]];
    const tableData = itemsData.map((item, index) => [
      index + 1,
      item.category || "General",
      item.name || item.hardware_name || "Component",
      item.qty || 1,
      item.remarks || "-",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: darkTextColor,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 65 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 57 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // 4. Borrow Duration
    currentY = drawSectionHeader("4. Schedule & Borrow Duration", currentY);

    doc.setFont("helvetica", "bold");
    doc.text("Takeaway Date:", 18, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(requestData.takeaway_date || "N/A", 55, currentY);

    doc.setFont("helvetica", "bold");
    doc.text("Expected Return Date:", 110, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(requestData.return_date || "N/A", 155, currentY);
    currentY += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Total Borrow Duration:", 18, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`${requestData.total_days || 0} Days`, 55, currentY);
    currentY += 10;

    // 5. Signatures & Office Approval Block (BLANK FOR ADMIN)
    currentY = drawSectionHeader("5. Authorization & Signatures (Office Use)", currentY);

    // Box grid for signatures
    const boxWidth = 57;
    const boxHeight = 28;

    // Box 1: Applicant Signature
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, currentY, boxWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("APPLICANT SIGNATURE", 18, currentY + 5);
    doc.setFont("helvetica", "italic");
    doc.text("Digitally Signed via OTP", 18, currentY + 16);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 18, currentY + 22);

    // Box 2: Faculty Mentor Signature (BLANK)
    doc.rect(76.5, currentY, boxWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.text("FACULTY MENTOR", 80.5, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("(Signature & Date)", 80.5, currentY + 22);

    // Box 3: Hardware In-Charge / Admin Approval (BLANK)
    doc.rect(139, currentY, boxWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.text("HARDWARE MANAGER", 143, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Final ID: ________________", 143, currentY + 16);
    doc.text("Approved Stamp & Date", 143, currentY + 22);

    currentY += boxHeight + 8;

    // Footer Disclaimer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      "Note: This document is a temporary hardware requisition draft generated via Robotics Club AVV Portal V3. Hardware issue is subject to physical verification and administrator sign-off.",
      14,
      285
    );

    // Download PDF File
    const filename = `Hardware_Request_${requestData.temp_request_id || "TEMP"}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("PDF Generation error:", error);
    throw error;
  }
}
