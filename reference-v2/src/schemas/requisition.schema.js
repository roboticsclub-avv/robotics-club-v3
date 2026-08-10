/**
 * Hardware Requisition Validation Schemas & Field Constants
 * Robotics Club AVV Website V3
 */

export const REQUISITION_LIMITS = {
  PROJECT_TITLE_MAX: 100,
  PROJECT_DESC_MAX: 500,
  PURPOSE_MAX: 300,
  EXPECTED_OUTCOME_MAX: 300,
  FACULTY_MENTOR_MAX: 100,
  MAX_BORROW_DAYS: 30,
};

export const PROJECT_TYPES = [
  "Club Project",
  "Academic Research",
  "Competition",
  "Course Work / Capstone",
  "Personal Prototype",
];

/**
 * Generate Temporary Request ID
 * Format: REQ-TEMP-2026-XXX
 */
export function generateTempRequestId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `REQ-TEMP-${year}-${randomNum}`;
}

/**
 * Validate Requisition Form Data
 */
export function validateRequisitionForm(data, selectedItems) {
  const errors = {};

  if (!data.project_title || !data.project_title.trim()) {
    errors.project_title = "Project Title is required.";
  } else if (data.project_title.length > REQUISITION_LIMITS.PROJECT_TITLE_MAX) {
    errors.project_title = `Project Title cannot exceed ${REQUISITION_LIMITS.PROJECT_TITLE_MAX} characters.`;
  }

  if (!data.project_desc || !data.project_desc.trim()) {
    errors.project_desc = "Project Description is required.";
  } else if (data.project_desc.length > REQUISITION_LIMITS.PROJECT_DESC_MAX) {
    errors.project_desc = `Project Description cannot exceed ${REQUISITION_LIMITS.PROJECT_DESC_MAX} characters.`;
  }

  if (!data.project_type) {
    errors.project_type = "Project Type selection is required.";
  }

  if (!data.purpose || !data.purpose.trim()) {
    errors.purpose = "Purpose of hardware is required.";
  } else if (data.purpose.length > REQUISITION_LIMITS.PURPOSE_MAX) {
    errors.purpose = `Purpose cannot exceed ${REQUISITION_LIMITS.PURPOSE_MAX} characters.`;
  }

  if (!data.expected_outcome || !data.expected_outcome.trim()) {
    errors.expected_outcome = "Expected outcome is required.";
  } else if (data.expected_outcome.length > REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX) {
    errors.expected_outcome = `Expected outcome cannot exceed ${REQUISITION_LIMITS.EXPECTED_OUTCOME_MAX} characters.`;
  }

  if (!data.takeaway_date) {
    errors.takeaway_date = "Takeaway Date is required.";
  }

  if (!data.return_date) {
    errors.return_date = "Expected Return Date is required.";
  } else if (data.takeaway_date && new Date(data.return_date) < new Date(data.takeaway_date)) {
    errors.return_date = "Return Date cannot be earlier than Takeaway Date.";
  }

  if (!selectedItems || selectedItems.length === 0) {
    errors.items = "You must select at least one component to requisition.";
  } else {
    const itemErrors = selectedItems.map((item) => {
      if (!item.qty || item.qty <= 0) return "Quantity must be greater than 0.";
      if (item.qty > item.availableQuantity) return `Quantity exceeds available stock (${item.availableQuantity}).`;
      return null;
    });
    if (itemErrors.some(Boolean)) {
      errors.items = "Please fix component quantity errors in table.";
    }
  }

  if (!data.agreedToPolicies) {
    errors.agreedToPolicies = "You must agree to the Robotics Club Hardware Usage Policies.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
