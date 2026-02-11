export const EEventStatus = {
  ABSENT: "absent",
  ATTENDED: "attended",
  CANCELLED: "cancelled",
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
} as const;

export type EEventStatus = (typeof EEventStatus)[keyof typeof EEventStatus];
