import type {
  NotificationItem,
  ProposalComponent,
  Task,
  TaskComment,
  Tender,
  TenderAssignment,
  TenderDocument,
} from '@/types/database';

// Clean production workspace — zero demo or sample records.
export const SEEDED_TENDERS: Tender[] = [];
export const SEEDED_COMPONENTS: ProposalComponent[] = [];
export const SEEDED_DOCUMENTS: TenderDocument[] = [];
export const SEEDED_ASSIGNMENTS: TenderAssignment[] = [];
export const SEEDED_TASKS: Task[] = [];
export const SEEDED_COMMENTS: TaskComment[] = [];
export const SEEDED_NOTIFICATIONS: NotificationItem[] = [];
