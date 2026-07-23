/**
 * Client-Side PDF Generator for Official Hardware Requisition Form
 * Robotics Club AVV Website V3
 *
 * Renders 1:1 official club Hardware Requisition & Consent Form across 3 pages:
 * Page 1: Header, Section A (Applicant Details), Section B (Hardware Requested 5-row table)
 * Page 2: Section C (Terms & Conditions, Signature), Section D (Approval - Office Use), Tear line
 * Page 3: Section E (Return & Clearance Form, Return Table), Final Clearance (Inspection & Charges)
 */

export async function generateRequisitionPDF(requestData, itemsData = []) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const marginX = 18;
    const pageWidth = 210;
    const contentWidth = pageWidth - marginX * 2; // 174mm

    // Date formatting helper
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    const issueDate = formatDate(requestData.takeaway_date || requestData.created_at || new Date());
    const reqId = requestData.temp_request_id || requestData.requisition_id || "REQ-TEMP-2026";
    const returnDate = formatDate(requestData.return_date);

    // Load Logo Image as base64 or HTMLImageElement
    let logoLoaded = false;
    let logoImg = null;
    if (typeof window !== "undefined") {
      logoImg = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/media/logo.png`;
      });
      if (logoImg) logoLoaded = true;
    }

    // Helper to draw horizontal section divider line
    const drawLine = (y) => {
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, marginX + contentWidth, y);
    };

    // Helper to draw double line
    const drawDoubleLine = (y) => {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, marginX + contentWidth, y);
      doc.line(marginX, y + 1, marginX + contentWidth, y + 1);
    };

    // ==========================================
    // PAGE 1: HEADER, SECTION A, SECTION B
    // ==========================================

    // 1. Header Logo & Title Block
    const topY = 16;

    // Logo on Top-Left
    if (logoLoaded && logoImg) {
      doc.setFillColor(15, 23, 42); // Dark Navy Background Box for Logo
      doc.rect(marginX, topY, 28, 28, "F");
      try {
        doc.addImage(logoImg, "PNG", marginX + 2, topY + 2, 24, 24);
      } catch {
        // Fallback logo icon
      }
    } else {
      doc.setFillColor(15, 23, 42);
      doc.rect(marginX, topY, 28, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("RC", marginX + 9, topY + 17);
    }

    // Header Right Alignment
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("ROBOTICS CLUB", marginX + contentWidth, topY + 7, { align: "right" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Amrita Vishwa Vidyapeetham,", marginX + contentWidth, topY + 14, { align: "right" });
    doc.text("Amaravati Campus", marginX + contentWidth, topY + 20, { align: "right" });

    // Title Centered
    let curY = topY + 36;
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("HARDWARE REQUISITION & CONSENT FORM", pageWidth / 2, curY, { align: "center" });

    // Underline below main title
    const titleWidth = doc.getTextWidth("HARDWARE REQUISITION & CONSENT FORM");
    doc.setLineWidth(0.5);
    doc.line((pageWidth - titleWidth) / 2, curY + 1.5, (pageWidth + titleWidth) / 2, curY + 1.5);

    curY += 12;

    // Date of Issue & Requisition ID
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.text("Date of Issue: ", marginX, curY);

    // Draw Line for Date of Issue
    const issueLabelW = doc.getTextWidth("Date of Issue: ");
    doc.setLineWidth(0.2);
    doc.line(marginX + issueLabelW, curY + 1, marginX + 85, curY + 1);
    doc.setFont("times", "bold");
    doc.text(issueDate, marginX + issueLabelW + 4, curY);

    doc.setFont("times", "normal");
    doc.text("Requisition ID: ", marginX + 90, curY);
    const reqIdLabelW = doc.getTextWidth("Requisition ID: ");
    doc.line(marginX + 90 + reqIdLabelW, curY + 1, marginX + 148, curY + 1);
    doc.setFont("times", "bold");
    doc.text(reqId, marginX + 90 + reqIdLabelW + 2, curY);

    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text("(For Office Use)", marginX + 150, curY);

    curY += 8;
    drawLine(curY);
    curY += 8;

    // SECTION A: APPLICANT DETAILS
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("SECTION A: APPLICANT DETAILS", marginX, curY);
    curY += 2;
    doc.setLineWidth(0.4);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 8;

    const applicantFields = [
      { label: "Name of Applicant", value: requestData.user_name || "N/A" },
      { label: "Roll Number", value: requestData.roll_number || requestData.member_id || "N/A" },
      { label: "Project / Team Name", value: requestData.project_title || "N/A" },
      { label: "Contact Number", value: requestData.phone || "N/A" },
      { label: "Expected Date of Return", value: returnDate || "N/A" },
    ];

    applicantFields.forEach((field) => {
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(field.label, marginX, curY);

      // Line for input value
      curY += 6;
      doc.setLineWidth(0.25);
      doc.line(marginX, curY, marginX + contentWidth, curY);

      // Value text written right above line
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.text(field.value, marginX + 2, curY - 1.5);

      curY += 7;
    });

    curY += 4;

    // SECTION B: HARDWARE REQUESTED
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("SECTION B: HARDWARE REQUESTED", marginX, curY);
    curY += 2;
    doc.setLineWidth(0.4);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 6;

    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text("To be filled by the Applicant at the time of issue.", marginX, curY);
    curY += 4;

    // Hardware Table (5 Rows)
    const tableBodyPage1 = [];
    for (let i = 0; i < 5; i++) {
      const item = itemsData[i];
      if (item) {
        tableBodyPage1.push([
          (i + 1).toString(),
          item.name || item.hardware_name || "",
          item.specs || item.remarks || "-",
          "", // Serial No. / ID (Blank for Office Use)
          (item.qty || 1).toString(),
        ]);
      } else {
        tableBodyPage1.push([(i + 1).toString(), "", "", "", ""]);
      }
    }

    autoTable(doc, {
      startY: curY,
      head: [["S.No.", "Component Name", "Specifications / Model", "Serial No. / ID", "Quantity"]],
      body: tableBodyPage1,
      theme: "plain",
      styles: {
        font: "times",
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        cellPadding: 3.5,
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [245, 245, 245],
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 52 },
        2: { cellWidth: 54 },
        3: { cellWidth: 36 },
        4: { cellWidth: 18, halign: "center" },
      },
      margin: { left: marginX, right: marginX },
    });

    // ==========================================
    // PAGE 2: SECTION C (TERMS) & SECTION D (APPROVAL)
    // ==========================================
    doc.addPage();
    curY = 20;

    // SECTION C: TERMS AND CONDITIONS
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("SECTION C: TERMS AND CONDITIONS (LIABILITY & OWNERSHIP)", marginX, curY);
    curY += 2;
    doc.setLineWidth(0.4);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 6;

    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    const textP1 =
      "By signing this form, the applicant agrees to the following terms regarding the custody of Robotics Club assets and the ownership of developed projects:";
    const linesP1 = doc.splitTextToSize(textP1, contentWidth);
    doc.text(linesP1, marginX, curY);
    curY += linesP1.length * 4.5 + 2;

    // Official Bullets List
    const bullets = [
      {
        title: "Care of Assets: ",
        body: "The applicant acknowledges that the hardware listed above is the property of the Robotics Club and agrees to handle it with extreme care.",
      },
      {
        title: "Scope of Use: ",
        body: "The hardware is to be used strictly for the academic/club project specified in Section A.",
      },
      {
        title: "Project Ownership & Rights: ",
        body: "",
        subbullets: [
          "Club Property: Any physical prototype or project constructed using the Robotics Club’s hardware remains the sole property of the Robotics Club. The completed project must be deposited back to the club upon completion.",
          "External Competitions: The applicant/team is permitted to showcase the project in external competitions, hackathons, or exhibitions.",
          "Temporary Issue: To take the project out for such events, the team must obtain prior approval and sign a temporary issue request.",
        ],
      },
      {
        title: "Liability for Damage/Loss: ",
        body: "In the event of physical damage, burning of components, loss, or functional impairment due to negligence or misuse:",
        subbullets: [
          "The applicant is liable to replace/fulfill the specific hardware with an identical functioning model.",
          "Alternatively, monetary charges equivalent to the current market value (including shipping) will be levied.",
        ],
      },
      {
        title: "Timely Return: ",
        body: "All items must be returned by the \"Expected Date of Return.\" Extensions must be requested in writing.",
      },
    ];

    bullets.forEach((bullet) => {
      doc.setFont("times", "bold");
      doc.text("•  " + bullet.title, marginX, curY);
      const titleW = doc.getTextWidth("•  " + bullet.title);

      if (bullet.body) {
        doc.setFont("times", "normal");
        const bodyLines = doc.splitTextToSize(bullet.body, contentWidth - titleW);
        if (bodyLines.length > 0) {
          doc.text(bodyLines[0], marginX + titleW, curY);
          if (bodyLines.length > 1) {
            const restLines = bodyLines.slice(1);
            curY += 4;
            doc.text(restLines, marginX + 6, curY);
            curY += (restLines.length - 1) * 4;
          }
        }
      }
      curY += 4.5;

      if (bullet.subbullets) {
        bullet.subbullets.forEach((sub) => {
          doc.setFont("times", "normal");
          const subLines = doc.splitTextToSize("–  " + sub, contentWidth - 10);
          doc.text(subLines, marginX + 8, curY);
          curY += subLines.length * 4;
        });
      }
    });

    curY += 2;

    // Applicant Acceptance Statement
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    const acceptance =
      "I have read and understood the terms above. I accept full financial and disciplinary responsibility for the hardware and acknowledge the club's ownership of the final project.";
    const accLines = doc.splitTextToSize(acceptance, contentWidth);
    doc.text(accLines, marginX, curY);
    curY += accLines.length * 4.5 + 8;

    // Signature of Applicant Line
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Signature of Applicant: ", marginX, curY);
    const sigLabelW = doc.getTextWidth("Signature of Applicant: ");
    doc.setLineWidth(0.2);
    doc.line(marginX + sigLabelW, curY + 1, marginX + 115, curY + 1);

    // Auto-fill typed applicant name / verification
    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text(requestData.user_name || "Digitally Signed", marginX + sigLabelW + 4, curY);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Date: ", marginX + 120, curY);
    doc.line(marginX + 120 + 12, curY + 1, marginX + contentWidth, curY + 1);
    doc.setFont("times", "bold");
    doc.text(issueDate, marginX + 120 + 14, curY);

    curY += 10;
    drawLine(curY);
    curY += 10;

    // SECTION D: APPROVAL (FOR OFFICE USE)
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("SECTION D: APPROVAL (FOR OFFICE USE)", marginX, curY);
    curY += 2;
    doc.setLineWidth(0.4);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 8;

    // Checkboxes
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Status:   [  ] Approved   [  ] Rejected", marginX, curY);
    curY += 10;

    doc.text("Signature of President (Robotics Club): ", marginX, curY);
    const presLabelW = doc.getTextWidth("Signature of President (Robotics Club): ");
    doc.setLineWidth(0.2);
    doc.line(marginX + presLabelW, curY + 1, marginX + 120, curY + 1);

    doc.text("Date: ", marginX + 124, curY);
    doc.line(marginX + 124 + 12, curY + 1, marginX + contentWidth, curY + 1);

    curY += 14;
    drawLine(curY);
    curY += 8;

    // Tear-off notice
    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text("(TEAR HERE OR PRINT ON BACK FOR RETURN)", pageWidth / 2, curY, { align: "center" });

    curY += 4;
    drawDoubleLine(curY);

    // ==========================================
    // PAGE 3: SECTION E (RETURN & CLEARANCE FORM)
    // ==========================================
    doc.addPage();
    curY = 20;

    // SECTION E: RETURN & CLEARANCE FORM
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("SECTION E: RETURN & CLEARANCE FORM", marginX, curY);
    curY += 2;
    doc.setLineWidth(0.4);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 6;

    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text("To be filled upon the return of hardware.", marginX, curY);
    curY += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Date of Return: ", marginX, curY);
    doc.setLineWidth(0.2);
    doc.line(marginX + 28, curY + 1, marginX + 85, curY + 1);

    curY += 8;

    // Return Table (5 Rows)
    const tableBodyPage3 = [];
    for (let i = 0; i < 5; i++) {
      const item = itemsData[i];
      if (item) {
        tableBodyPage3.push([(i + 1).toString(), item.name || item.hardware_name || "", "", "", ""]);
      } else {
        tableBodyPage3.push([(i + 1).toString(), "", "", "", ""]);
      }
    }

    autoTable(doc, {
      startY: curY,
      head: [["S.No.", "Component Name", "Returned Qty", "Condition upon Return", "Remarks"]],
      body: tableBodyPage3,
      theme: "plain",
      styles: {
        font: "times",
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        cellPadding: 3.5,
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [245, 245, 245],
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 60 },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: 42 },
        4: { cellWidth: 30 },
      },
      margin: { left: marginX, right: marginX },
    });

    curY = doc.lastAutoTable.finalY + 10;
    drawLine(curY);
    curY += 8;

    // FINAL CLEARANCE
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("FINAL CLEARANCE", marginX, curY);
    curY += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Inspection Result:", marginX, curY);
    curY += 6;

    doc.text("[  ]  All items returned in good condition.", marginX + 4, curY);
    curY += 6;
    doc.text("[  ]  Items damaged/missing. Action required.", marginX + 4, curY);
    curY += 8;

    doc.text("Action Taken (If Damaged):", marginX, curY);
    curY += 6;
    doc.text("[  ]  Replacement Submitted", marginX + 4, curY);
    curY += 6;
    doc.text("[  ]  Charges Applied: \u20B9 _______________", marginX + 4, curY);
    curY += 12;

    doc.text("Signature of Receiver (Operations Team): ", marginX, curY);
    const recLabelW = doc.getTextWidth("Signature of Receiver (Operations Team): ");
    doc.setLineWidth(0.2);
    doc.line(marginX + recLabelW, curY + 1, marginX + 120, curY + 1);

    doc.text("Date: ", marginX + 124, curY);
    doc.line(marginX + 124 + 12, curY + 1, marginX + contentWidth, curY + 1);

    curY += 14;
    drawDoubleLine(curY);

    // Save and download PDF
    const filename = `Official_Hardware_Requisition_${reqId}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("Official Requisition PDF generation error:", error);
    throw error;
  }
}
