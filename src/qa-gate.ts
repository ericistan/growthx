import { QaReportSchema, type QaReport } from "./contracts.js";

export function shouldDeploy(candidate: QaReport): boolean {
  const report = QaReportSchema.parse(candidate);
  return (
    report.status === "pass" &&
    report.unsupportedClaims.length === 0 &&
    report.brokenLinks.length === 0 &&
    report.missingSections.length === 0
  );
}
