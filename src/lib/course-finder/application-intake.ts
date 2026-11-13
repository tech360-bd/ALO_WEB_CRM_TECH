/** Displayed and accepted label for a source-backed course intake. */
export function applicationIntakeLabel(intake: { intakeName: string | null; intakeMonth: string | null; intakeYear: number | null }): string {
  return (intake.intakeName || [intake.intakeMonth, intake.intakeYear].filter(Boolean).join(' ')).trim();
}
