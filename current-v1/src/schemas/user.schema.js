/**
 * User Profile Firestore Document Schema Specifier
 */
export const userSchema = {
  uid: { type: "String", required: true },
  email: { type: "String", required: true },
  name: { type: "String", required: true },
  phone: { type: "String", default: "" },
  branch: { type: "String", required: true },
  year: { type: "String", required: true },
  section: { type: "String", default: "" },
  interests: { type: "String", required: true },
  reason: { type: "String", default: "" },
  photoURL: { type: "String", required: true }, // Added photoURL
  role: { type: "String", enum: ["member", "admin"], default: "member" },
  status: { type: "String", enum: ["pending", "accepted", "rejected"], default: "pending" },
  memberId: { type: "String", default: "PENDING" },
  createdAt: { type: "String", required: true },
};

/**
 * Validates a recruitment application step or the final payload
 * @param {Object} data - Application data object
 * @param {number} step - Current step index (optional)
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateRecruitmentField(field, value) {
  switch (field) {
    case "name":
      if (!value || value.trim().length < 2) {
        return "Please enter your full name (min 2 characters)";
      }
      break;
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value.trim())) {
        return "Please enter a valid college email address";
      }
      break;
    }
    case "password":
      if (!value || value.length < 6) {
        return "Password must be at least 6 characters";
      }
      break;
    case "year":
      if (!value) {
        return "Please select your current year";
      }
      break;
    case "branch":
      if (!value) {
        return "Please select your branch";
      }
      break;
    case "section":
      if (!value || value.trim().length < 1) {
        return "Please enter your class section";
      }
      break;
    case "interests":
      if (!value) {
        return "Please select your primary interest";
      }
      break;
    case "reason":
      if (!value || value.trim().length < 10) {
        return "Please share your motivation (minimum 10 characters)";
      }
      break;
    case "photo":
      if (!value) {
        return "Please upload a profile photograph";
      }
      break;
    default:
      break;
  }
  return null;
}
