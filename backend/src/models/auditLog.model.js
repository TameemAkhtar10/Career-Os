import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);

/**
 * Helper to record an administrative action. Non-blocking.
 */
export const logAdminAction = async ({ adminId, action, targetType, targetId, meta = {} }) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      meta,
    });
  } catch (err) {
    console.error(`[auditLog] Failed to record admin action (${action}):`, err.message);
  }
};
