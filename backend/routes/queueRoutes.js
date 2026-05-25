const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const Queue = require("../models/Queue");
const { OPERATIONS_ROLES } = require("../constants/roles");
const {
  LEGACY_QUEUE_STATUS_MAP,
  QUEUE_STATUSES,
  getContinueTransition,
  getRevertTransition,
  normalizeQueueStatus,
} = require("../constants/queueWorkflow");

const getNextQueueNumber = async () => {
  const lastQueueItem = await Queue.findOne()
    .sort({ queueNumber: -1 })
    .select("queueNumber");

  return (lastQueueItem?.queueNumber || 0) + 1;
};

const migrateLegacyQueueStatuses = async () => {
  await Promise.all(
    Object.entries(LEGACY_QUEUE_STATUS_MAP).map(([legacyStatus, nextStatus]) =>
      Queue.updateMany({ status: legacyStatus }, { status: nextStatus })
    )
  );
};

const normalizeQueueItem = async (queueItem) => {
  if (!queueItem) return null;

  const normalizedStatus = normalizeQueueStatus(queueItem.status);

  if (normalizedStatus !== queueItem.status) {
    queueItem.status = normalizedStatus;
    await queueItem.save();
  }

  return queueItem;
};

const transitionErrorStatus = (message) =>
  message.startsWith("Only") ? 403 : 400;

// CREATE queue entry
router.post(
  "/",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
    try {
      const existingQueue = await Queue.findOne({
        appointmentId: req.body.appointmentId,
        status: { $nin: ["Completed", "Cancelled"] },
      });

      if (existingQueue) {
        return res.status(400).json({
          message: "This appointment is already in the queue",
        });
      }

      const queue = await Queue.create({
        ...req.body,
        status: normalizeQueueStatus(req.body.status || QUEUE_STATUSES.WAITING),
        queueNumber: await getNextQueueNumber(),
      });

      res.status(201).json(queue);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET all queue entries
router.get(
  "/",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
  try {
    await migrateLegacyQueueStatuses();
    const queue = await Queue.find().sort({ queueNumber: 1 });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE queue details only. Status changes must use continue/revert.
router.put(
  "/:id",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      return res.status(400).json({
        message: "Use queue continue/revert actions to change status.",
      });
    }

    const existingQueue = await normalizeQueueItem(
      await Queue.findById(req.params.id)
    );

    if (!existingQueue) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedQueue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/:id/continue",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
    try {
      await migrateLegacyQueueStatuses();

      const queueItem = await normalizeQueueItem(
        await Queue.findById(req.params.id)
      );

      if (!queueItem) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      const transition = getContinueTransition(queueItem.status, req.user.role);

      if (transition.error) {
        return res
          .status(transitionErrorStatus(transition.error))
          .json({ message: transition.error });
      }

      if (transition.nextStatus === QUEUE_STATUSES.COMPLETED) {
        const billing = await Billing.findOne({ queueId: queueItem._id });

        if (!billing) {
          return res.status(400).json({
            message: "Billing must be saved before completing queue item.",
          });
        }
      }

      queueItem.status = transition.nextStatus;
      const updatedQueue = await queueItem.save();

      if (
        updatedQueue.appointmentId &&
        updatedQueue.status === QUEUE_STATUSES.COMPLETED
      ) {
        await Appointment.findByIdAndUpdate(updatedQueue.appointmentId, {
          status: "Completed",
        });
      }

      res.json(updatedQueue);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/:id/revert",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
    try {
      await migrateLegacyQueueStatuses();

      const queueItem = await normalizeQueueItem(
        await Queue.findById(req.params.id)
      );

      if (!queueItem) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      const transition = getRevertTransition(queueItem.status, req.user.role);

      if (transition.error) {
        return res
          .status(transitionErrorStatus(transition.error))
          .json({ message: transition.error });
      }

      queueItem.status = transition.previousStatus;
      const updatedQueue = await queueItem.save();

      res.json(updatedQueue);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
