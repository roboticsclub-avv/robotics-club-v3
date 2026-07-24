/**
 * Event Firestore Document Schema Specifier
 */
export const eventSchema = {
  title: { type: "String", required: true },
  date: { type: "String", default: "" }, // Format: YYYY-MM-DD
  comingSoon: { type: "Boolean", default: false },
  image: { type: "String", required: true }, // Image URL
  description: { type: "String", required: true },
  link: { type: "String", default: "" },
  createdAt: { type: "String", required: true },
  updatedAt: { type: "String", default: "" },
};
