export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export const NOTIFICATION_TYPE_META = {
  leave_request: { label: 'Leave Request', color: 'bg-amber-500' },
  leave_approved: { label: 'Leave Approved', color: 'bg-emerald-500' },
  leave_rejected: { label: 'Leave Rejected', color: 'bg-rose-500' },
  task_assigned: { label: 'Task Assigned', color: 'bg-blue-500' },
  task_completed: { label: 'Task Completed', color: 'bg-emerald-500' },
  announcement: { label: 'Announcement', color: 'bg-violet-500' },
  payroll_updated: { label: 'Payroll', color: 'bg-blue-500' },
  payslip_generated: { label: 'Payslip', color: 'bg-blue-500' },
  attendance_reminder: { label: 'Attendance', color: 'bg-amber-500' },
  review_scheduled: { label: 'Review', color: 'bg-violet-500' },
  document_verified: { label: 'Document', color: 'bg-emerald-500' },
  candidate_status: { label: 'Candidate', color: 'bg-blue-500' },
  general: { label: 'General', color: 'bg-slate-400' }
};

export function getTypeMeta(type) {
  return NOTIFICATION_TYPE_META[type] || NOTIFICATION_TYPE_META.general;
}