import emailjs from '@emailjs/browser';

const MAIL_CONFIG = {
    SERVICE_ID: "service_eqt49es",
    ACCEPTANCE_TEMPLATE_ID: "template_gbinztp",
    REJECTION_TEMPLATE_ID: "template_tj1pez3",
    PUBLIC_KEY: "py4w749i8WQem0P6c"
};

export const initEmailJS = () => {
    emailjs.init(MAIL_CONFIG.PUBLIC_KEY);
};

export const sendStatusNotification = async (email, name, memberId, newStatus, interests) => {
    if (!email) throw new Error("Recipient email is empty");

    const templateParams = {
        to_name: name,
        to_email: email,
        email: email,
        user_email: email,
        recipient: email,
        reply_to: email,
        member_id: memberId || 'Pending',
        interests: interests || 'General',
        status: newStatus,
        message: newStatus === 'accepted'
            ? "Congratulations! Your application to the Robotics Club has been ACCEPTED."
            : "Thank you for your interest. Application not accepted at this time."
    };

    const templateId = newStatus === 'accepted' ? MAIL_CONFIG.ACCEPTANCE_TEMPLATE_ID : MAIL_CONFIG.REJECTION_TEMPLATE_ID;

    return await emailjs.send(MAIL_CONFIG.SERVICE_ID, templateId, templateParams);
};
