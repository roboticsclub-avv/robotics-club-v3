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
  role: { type: "String", enum: ["member", "admin"], default: "member" },
  status: { type: "String", enum: ["pending", "accepted", "rejected"], default: "pending" },
  memberId: { type: "String", default: "PENDING" },
  createdAt: { type: "String", required: true },
};
