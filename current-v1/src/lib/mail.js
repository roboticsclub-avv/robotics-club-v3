import emailjs from "@emailjs/browser";
import { env } from "./env";

export const MAIL_CONFIG = {
  SERVICE_ID: env.emailjs.serviceId || "service_eqt49es",
  ACCEPTANCE_TEMPLATE_ID: env.emailjs.acceptanceTemplateId || "template_gbinztp",
  REJECTION_TEMPLATE_ID: env.emailjs.rejectionTemplateId || "template_tj1pez3",
  PUBLIC_KEY: env.emailjs.publicKey || "py4w749i8WQem0P6c",
};

/**
 * Sends a status change notification using EmailJS
 * @param {string} email - Applicant email
 * @param {string} name - Applicant name
 * @param {string} memberId - Assigned Member ID (RC-XXXX)
 * @param {string} newStatus - 'accepted' | 'rejected'
 */
export const sendStatusNotification = async (email, name, memberId, newStatus) => {
  console.log(`[MAIL SYSTEM] Sending notification. To: ${email}, Name: ${name}, Status: ${newStatus}`);

  if (MAIL_CONFIG.PUBLIC_KEY === "YOUR_PUBLIC_KEY" || !MAIL_CONFIG.PUBLIC_KEY) {
    console.warn("[MAIL SYSTEM] Configuration missing. Skipping email.");
    return;
  }

  const templateId = newStatus === 'accepted'
    ? MAIL_CONFIG.ACCEPTANCE_TEMPLATE_ID
    : MAIL_CONFIG.REJECTION_TEMPLATE_ID;

  const templateParams = {
    to_name: name,
    to_email: email,
    email: email,
    user_email: email,
    recipient: email,
    reply_to: email,
    member_id: memberId || 'Pending',
    status: newStatus,
    message: newStatus === 'accepted'
      ? "Congratulations! Your application to the Robotics Club has been ACCEPTED."
      : "Thank you for your interest. After careful review, we regret to inform you that your application has not been accepted at this time."
  };

  try {
    emailjs.init(MAIL_CONFIG.PUBLIC_KEY);
    const response = await emailjs.send(
      MAIL_CONFIG.SERVICE_ID,
      templateId,
      templateParams
    );
    console.log("[MAIL SYSTEM] Email sent successfully!", response.status, response.text);
    return response;
  } catch (error) {
    console.error("[MAIL SYSTEM] Failed to send email:", error);
    throw error;
  }
};
