import { MAIL_CONFIG } from './mail-config.js';

/**
 * mail.js - Real Mail System for Robotics Club using EmailJS
 * This module handles actual notifications for member application status changes.
 */

// Load EmailJS SDK
const script = document.createElement('script');
script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
document.head.appendChild(script);

script.onload = () => {
    if (MAIL_CONFIG.PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        emailjs.init(MAIL_CONFIG.PUBLIC_KEY);
    }
};

export const sendStatusNotification = async (email, name, memberId, newStatus) => {

    console.log(`[MAIL DEBUG] Sending to: ${email}, Name: ${name}, ID: ${memberId}, Status: ${newStatus}`);

    if (MAIL_CONFIG.PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
        console.warn("[MAIL SYSTEM] Mail not sent: Configuration missing in mail-config.js");
        return;
    }

    if (!email) {
        console.error("[MAIL ERROR] Email address is missing or empty.");
        throw new Error("Cannot send email: Recipient address is empty.");
    }

    const templateId = newStatus === 'accepted'
        ? MAIL_CONFIG.ACCEPTANCE_TEMPLATE_ID
        : MAIL_CONFIG.REJECTION_TEMPLATE_ID;

    const templateParams = {
        // "Shotgun" approach: Send common variations since we don't know the exact
        // variable name configured in the user's EmailJS template "To" field.
        to_name: name,

        // Target variations
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
