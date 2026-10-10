// ============================================================================
// ALO Service Charge / Money-Back Declaration (spec: SERVICE CHARGE / MONEY
// BACK DECLARATION SECTION). Pure template + validator, no db.
//
// A declaration document must be used OFFICIALLY and approved by authorized
// ALO management before processing any payment-related stage.
// ============================================================================

export interface ServiceChargeDeclarationFields {
  studentName: string;
  applicationNumber: string;
  university: string;
  course: string;
  intake: string;
  serviceChargePolicy: "NO_SERVICE_CHARGE" | "STANDARD_SERVICE_CHARGE";
  managementApproverName: string;
  date: string; // ISO
}

/** Official ALO declaration template — placeholders must be filled. */
export const SERVICE_CHARGE_DECLARATION_TEMPLATE =
  "ALO EDUCATION — OFFICIAL DECLARATION\n" +
  "Reference Application: {applicationNumber}\n" +
  "Student: {studentName} | University: {university} | Course: {course} | Intake: {intake}\n\n" +
  "1. POLICY\n" +
  "   ALO Education follows a {serviceChargePolicy} policy for this application. " +
  "   No agent or sub-agent commission is charged to this student that is not approved and recorded by authorized ALO management.\n\n" +
  "2. FEE & REFUND POSITION\n" +
  "   Any fee payable, and any money-back or refund position, applies strictly as documented here and approved by authorized management. " +
  "   No verbal promise, guarantee of admission, or guarantee of visa outcome is valid unless written here.\n\n" +
  "3. APPROVAL\n" +
  "   This declaration is valid only after approval by authorized ALO management.\n\n" +
  "Approved by (Authorized Management): {managementApproverName}    Date: {date}\n" +
  "Declaration Number: {declarationNumber}\n";

export function buildServiceChargeDeclaration(fields: ServiceChargeDeclarationFields): string {
  const declarationNumber = `ALO-DECL-${fields.applicationNumber}-${fields.date.slice(0, 10).replace(/-/g, "")}`;
  return SERVICE_CHARGE_DECLARATION_TEMPLATE
    .replace("{applicationNumber}", fields.applicationNumber)
    .replace("{studentName}", fields.studentName)
    .replace("{university}", fields.university)
    .replace("{course}", fields.course)
    .replace("{intake}", fields.intake)
    .replace("{serviceChargePolicy}", fields.serviceChargePolicy === "NO_SERVICE_CHARGE" ? "NO-SERVICE-CHARGE" : "STANDARD SERVICE CHARGE")
    .replace("{managementApproverName}", fields.managementApproverName)
    .replace("{date}", fields.date.slice(0, 10))
    .replace("{declarationNumber}", declarationNumber);
}

/** A declaration may only be USED after these hold (management-approved discipline). */
export function validateServiceChargeDeclaration(text: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const t = String(text || "");
  if (/\{[a-zA-Z]+\}/.test(t)) issues.push("Template placeholders still present — every {field} must be filled before use");
  if (!/reference application:/i.test(t)) issues.push("Missing application reference");
  if (!/approved by/i.test(t)) issues.push("Missing management approval line — declaration is invalid without authorized approval");
  if (!/declaration number:/i.test(t)) issues.push("Missing declaration number");
  if (!/student:/i.test(t)) issues.push("Missing student name");
  return { ok: issues.length === 0, issues };
}
