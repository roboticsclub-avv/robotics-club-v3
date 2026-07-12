/**
 * Allocation Firestore Document Schema Specifier
 */
export const allocationSchema = {
  userId: { type: "String", required: true },
  userName: { type: "String", required: true },
  memberId: { type: "String", required: true },
  itemId: { type: "String", required: true },
  itemName: { type: "String", required: true },
  expectedReturn: { type: "String", required: true }, // Format: YYYY-MM-DD
  status: { type: "String", enum: ["issued", "returned"], default: "issued" },
  issuedAt: { type: "timestamp", required: true },
  returnedAt: { type: "timestamp", default: "" },
};
