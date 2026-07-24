/**
 * Inventory Item Firestore Document Schema Specifier
 */
export const inventorySchema = {
  name: { type: "String", required: true },
  category: { type: "String", required: true },
  totalQuantity: { type: "Number", required: true },
  availableQuantity: { type: "Number", required: true },
  image: { type: "String", default: "" },
  createdAt: { type: "timestamp", required: true },
  updatedAt: { type: "timestamp", default: "" },
};
