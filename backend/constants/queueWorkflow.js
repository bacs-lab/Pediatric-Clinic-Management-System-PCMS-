const { ROLES } = require("./roles");

const QUEUE_STATUSES = Object.freeze({
  WAITING: "Waiting",
  ASSESSMENT: "Assessment",
  CONSULTATION: "Consultation",
  BILLING: "Billing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
});

const QUEUE_STATUS_VALUES = Object.freeze(Object.values(QUEUE_STATUSES));

const LEGACY_QUEUE_STATUS_MAP = Object.freeze({
  "In Assessment": QUEUE_STATUSES.ASSESSMENT,
  "For Consultation": QUEUE_STATUSES.CONSULTATION,
  "In Consultation": QUEUE_STATUSES.CONSULTATION,
  "For Billing": QUEUE_STATUSES.BILLING,
});

const NEXT_STATUS = Object.freeze({
  [QUEUE_STATUSES.WAITING]: QUEUE_STATUSES.ASSESSMENT,
  [QUEUE_STATUSES.ASSESSMENT]: QUEUE_STATUSES.CONSULTATION,
  [QUEUE_STATUSES.CONSULTATION]: QUEUE_STATUSES.BILLING,
  [QUEUE_STATUSES.BILLING]: QUEUE_STATUSES.COMPLETED,
});

const PREVIOUS_STATUS = Object.freeze({
  [QUEUE_STATUSES.ASSESSMENT]: QUEUE_STATUSES.WAITING,
  [QUEUE_STATUSES.CONSULTATION]: QUEUE_STATUSES.ASSESSMENT,
  [QUEUE_STATUSES.BILLING]: QUEUE_STATUSES.CONSULTATION,
});

const CONTINUE_ALLOWED_ROLES = Object.freeze({
  [QUEUE_STATUSES.WAITING]: [ROLES.DOCTOR, ROLES.SECRETARY, ROLES.STAFF],
  [QUEUE_STATUSES.ASSESSMENT]: [ROLES.DOCTOR],
  [QUEUE_STATUSES.CONSULTATION]: [ROLES.DOCTOR],
  [QUEUE_STATUSES.BILLING]: [ROLES.SECRETARY, ROLES.STAFF],
});

const normalizeQueueStatus = (status) => LEGACY_QUEUE_STATUS_MAP[status] || status;

const getContinueDeniedMessage = (status) => {
  if (status === QUEUE_STATUSES.ASSESSMENT) {
    return "Only doctors can continue from assessment.";
  }

  if (status === QUEUE_STATUSES.CONSULTATION) {
    return "Only doctors can continue from consultation.";
  }

  if (status === QUEUE_STATUSES.BILLING) {
    return "Only secretary or staff can continue from billing.";
  }

  if (status === QUEUE_STATUSES.WAITING) {
    return "Only doctor, secretary, or staff can continue from waiting.";
  }

  return "Invalid queue status transition.";
};

const getContinueTransition = (status, role) => {
  const currentStatus = normalizeQueueStatus(status);

  if (currentStatus === QUEUE_STATUSES.COMPLETED) {
    return { error: "Completed queue items cannot be modified." };
  }

  const nextStatus = NEXT_STATUS[currentStatus];

  if (!nextStatus) {
    return { error: "Invalid queue status transition." };
  }

  if (!CONTINUE_ALLOWED_ROLES[currentStatus]?.includes(role)) {
    return { error: getContinueDeniedMessage(currentStatus) };
  }

  return { currentStatus, nextStatus };
};

const getRevertTransition = (status, role) => {
  const currentStatus = normalizeQueueStatus(status);

  if (role !== ROLES.DOCTOR) {
    return { error: "Only doctors can revert queue status." };
  }

  if (currentStatus === QUEUE_STATUSES.COMPLETED) {
    return { error: "Completed queue items cannot be modified." };
  }

  const previousStatus = PREVIOUS_STATUS[currentStatus];

  if (!previousStatus) {
    return { error: "Invalid queue status transition." };
  }

  return { currentStatus, previousStatus };
};

module.exports = {
  QUEUE_STATUSES,
  QUEUE_STATUS_VALUES,
  LEGACY_QUEUE_STATUS_MAP,
  NEXT_STATUS,
  PREVIOUS_STATUS,
  normalizeQueueStatus,
  getContinueTransition,
  getRevertTransition,
};
