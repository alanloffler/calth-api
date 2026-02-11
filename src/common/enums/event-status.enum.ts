export const EEventStatus = {
  ABSENT: "absent",
  ATTENDEND: "attended",
  CANCELLED: "cancelled",
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
} as const;

export type EEventStatus = (typeof EEventStatus)[keyof typeof EEventStatus];
