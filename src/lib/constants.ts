// Labels for database enum values. Keep in step with supabase/migrations.

export const STAGES = [
  { value: "new_enquiry", label: "New enquiry", short: "Enquiry" },
  { value: "cipo_intake", label: "CIPO / Intake", short: "CIPO" },
  { value: "documents_outstanding", label: "Documents outstanding", short: "Docs outstanding" },
  { value: "application_preparation", label: "Application preparation", short: "Preparation" },
  { value: "submitted", label: "Submitted / Awaiting decision", short: "Submitted" },
  { value: "approved", label: "Approved / Completed", short: "Approved" },
  { value: "closed", label: "Documents returned / Case closed", short: "Closed" },
] as const;

export type Stage = (typeof STAGES)[number]["value"];

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.value, s.label])) as Record<Stage, string>;
export const STAGE_SHORT = Object.fromEntries(STAGES.map((s) => [s.value, s.short])) as Record<Stage, string>;

export function stageIndex(stage: Stage) {
  return STAGES.findIndex((s) => s.value === stage);
}

/** Stages from which a case can no longer go back without CIPO being complete. */
export function isPastCipo(stage: Stage) {
  return stageIndex(stage) > stageIndex("cipo_intake");
}

export const CIPO_STEPS = [
  "Receive all client information and documents",
  "Check documents are readable and complete",
  "Scan and upload documents",
  "Organise files into categories",
  "Identify missing documents and conflicting information",
  "Record whether documents are originals or copies",
  "Prepare a clear case summary",
  "Create the case file and assign responsibility",
  "Confirm the case is ready for processing",
] as const;

export const SERVICE_LEVELS = [
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "urgent", label: "Urgent" },
] as const;
export type ServiceLevel = (typeof SERVICE_LEVELS)[number]["value"];

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;
export type Priority = (typeof PRIORITIES)[number]["value"];

export const RELATIONSHIPS = [
  { value: "spouse", label: "Spouse", inverse: "spouse" },
  { value: "partner", label: "Partner", inverse: "partner" },
  { value: "child", label: "Child", inverse: "parent" },
  { value: "parent", label: "Parent", inverse: "child" },
  { value: "sibling", label: "Sibling", inverse: "sibling" },
  { value: "grandparent", label: "Grandparent", inverse: "grandchild" },
  { value: "grandchild", label: "Grandchild", inverse: "grandparent" },
  { value: "other", label: "Other relative", inverse: "other" },
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number]["value"];

export const DN_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "event", label: "Event" },
  { value: "concern", label: "Concern" },
  { value: "submission", label: "Submission" },
] as const;
export type DnType = (typeof DN_TYPES)[number]["value"];

export const TASK_TYPES = [
  { value: "general", label: "General" },
  { value: "client_reply", label: "Client reply" },
  { value: "document_chase", label: "Chase documents" },
  { value: "embassy_appointment", label: "Embassy / consulate appointment" },
  { value: "home_office_deadline", label: "Home Office deadline" },
  { value: "submission", label: "Submission" },
  { value: "courier", label: "Courier" },
  { value: "payment_follow_up", label: "Payment follow-up" },
] as const;
export type TaskType = (typeof TASK_TYPES)[number]["value"];

export const FINANCE_TYPES = [
  { value: "quotation", label: "Quotation", kind: "info" },
  { value: "invoice", label: "Invoice", kind: "charge" },
  { value: "government_fee", label: "Government fee", kind: "charge" },
  { value: "solicitor_fee", label: "Solicitor fee", kind: "charge" },
  { value: "courier_charge", label: "Courier charge", kind: "charge" },
  { value: "deposit", label: "Deposit", kind: "payment" },
  { value: "payment", label: "Payment", kind: "payment" },
  { value: "refund", label: "Refund", kind: "refund" },
] as const;
export type FinanceType = (typeof FINANCE_TYPES)[number]["value"];

export const SHIPMENT_DIRECTIONS = [
  { value: "from_client", label: "From client" },
  { value: "to_client", label: "To client" },
  { value: "to_authority", label: "To authority / embassy" },
  { value: "from_authority", label: "From authority / embassy" },
] as const;
export type ShipmentDirection = (typeof SHIPMENT_DIRECTIONS)[number]["value"];

export const SHIPMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "lost", label: "Lost" },
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]["value"];

export const CARRIERS = ["Royal Mail", "Royal Mail Special Delivery", "DHL", "FedEx", "UPS", "Hand delivered", "Other"];

export const DOCUMENT_CATEGORIES = [
  { value: "passport", label: "Passport / travel document" },
  { value: "identity", label: "Identity document" },
  { value: "civil", label: "Birth / marriage / civil record" },
  { value: "immigration", label: "Visa / immigration status" },
  { value: "photo", label: "Photos" },
  { value: "application", label: "Application form" },
  { value: "evidence", label: "Supporting evidence" },
  { value: "financial", label: "Financial" },
  { value: "correspondence", label: "Correspondence" },
  { value: "decision", label: "Decision / outcome" },
  { value: "authority", label: "Letter of authority / consent" },
  { value: "other", label: "Other" },
] as const;

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
): string {
  return list.find((i) => i.value === value)?.label ?? value ?? "";
}

export const DOCUMENTS_BUCKET = "case-documents";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
// Keep in step with the bucket's allowed_mime_types (storage migration).
export const UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "message/rfc822": "eml",
  "application/vnd.ms-outlook": "msg",
};
