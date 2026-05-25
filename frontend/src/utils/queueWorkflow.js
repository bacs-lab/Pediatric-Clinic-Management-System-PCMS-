import { ROLES } from "./roles";

export const QUEUE_STATUSES = {
  WAITING: "Waiting",
  ASSESSMENT: "Assessment",
  CONSULTATION: "Consultation",
  BILLING: "Billing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const QUEUE_COLUMNS = [
  QUEUE_STATUSES.WAITING,
  QUEUE_STATUSES.ASSESSMENT,
  QUEUE_STATUSES.CONSULTATION,
  QUEUE_STATUSES.BILLING,
  QUEUE_STATUSES.COMPLETED,
];

export const LEGACY_QUEUE_STATUS_MAP = {
  "In Assessment": QUEUE_STATUSES.ASSESSMENT,
  "For Consultation": QUEUE_STATUSES.CONSULTATION,
  "In Consultation": QUEUE_STATUSES.CONSULTATION,
  "For Billing": QUEUE_STATUSES.BILLING,
};

export const NEXT_STATUS = {
  [QUEUE_STATUSES.WAITING]: QUEUE_STATUSES.ASSESSMENT,
  [QUEUE_STATUSES.ASSESSMENT]: QUEUE_STATUSES.CONSULTATION,
  [QUEUE_STATUSES.CONSULTATION]: QUEUE_STATUSES.BILLING,
  [QUEUE_STATUSES.BILLING]: QUEUE_STATUSES.COMPLETED,
};

export const PREVIOUS_STATUS = {
  [QUEUE_STATUSES.ASSESSMENT]: QUEUE_STATUSES.WAITING,
  [QUEUE_STATUSES.CONSULTATION]: QUEUE_STATUSES.ASSESSMENT,
  [QUEUE_STATUSES.BILLING]: QUEUE_STATUSES.CONSULTATION,
};

const CONTINUE_ALLOWED_ROLES = {
  [QUEUE_STATUSES.WAITING]: [ROLES.DOCTOR, ROLES.SECRETARY, ROLES.STAFF],
  [QUEUE_STATUSES.ASSESSMENT]: [ROLES.DOCTOR],
  [QUEUE_STATUSES.CONSULTATION]: [ROLES.DOCTOR],
  [QUEUE_STATUSES.BILLING]: [ROLES.SECRETARY, ROLES.STAFF],
};

export const normalizeQueueStatus = (status) =>
  LEGACY_QUEUE_STATUS_MAP[status] || status;

export const canContinueQueue = (status, role) => {
  const normalizedStatus = normalizeQueueStatus(status);
  return CONTINUE_ALLOWED_ROLES[normalizedStatus]?.includes(role) || false;
};

export const canRevertQueue = (status, role) => {
  const normalizedStatus = normalizeQueueStatus(status);
  return role === ROLES.DOCTOR && Boolean(PREVIOUS_STATUS[normalizedStatus]);
};

export const getContinueLabel = (status) => {
  const nextStatus = NEXT_STATUS[normalizeQueueStatus(status)];

  if (nextStatus === QUEUE_STATUSES.COMPLETED) return "Mark as Completed";
  return nextStatus ? `Continue to ${nextStatus}` : "";
};

export const getRevertLabel = (status) => {
  const previousStatus = PREVIOUS_STATUS[normalizeQueueStatus(status)];
  return previousStatus ? `Revert to ${previousStatus}` : "";
};

export const getWorkflowTypeForStatus = (status) => {
  const normalizedStatus = normalizeQueueStatus(status);

  if (normalizedStatus === QUEUE_STATUSES.ASSESSMENT) return "assessment";
  if (normalizedStatus === QUEUE_STATUSES.CONSULTATION) return "consultation";
  if (normalizedStatus === QUEUE_STATUSES.BILLING) return "billing";
  return null;
};
