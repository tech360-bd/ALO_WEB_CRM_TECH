import { describe, expect, it } from 'vitest';
import { validateApplicationStageTransition } from '@/lib/application-manager/service';

describe('application lifecycle transition policy', () => {
  it('does not skip profile/document review before a university decision', () => {
    expect(validateApplicationStageTransition('APPLICATION_DRAFT', 'CONDITIONAL_OFFER').ok).toBe(false);
    expect(validateApplicationStageTransition('APPLICATION_DRAFT', 'SUBMITTED_TO_UNIVERSITY').ok).toBe(false);
    expect(validateApplicationStageTransition('READY_TO_SUBMIT', 'SUBMITTED_TO_UNIVERSITY').ok).toBe(true);
    expect(validateApplicationStageTransition('SUBMITTED_TO_UNIVERSITY', 'OFFER_RECEIVED').ok).toBe(true);
  });

  it('keeps B2B and university submission stages in their respective lanes', () => {
    expect(validateApplicationStageTransition('SUBMITTED_TO_B2B', 'VISA_FILE_CREATED').ok).toBe(false);
    expect(validateApplicationStageTransition('SUBMITTED_TO_B2B', 'B2B_ACKNOWLEDGED').ok).toBe(true);
    expect(validateApplicationStageTransition('B2B_ACKNOWLEDGED', 'SUBMITTED_TO_UNIVERSITY').ok).toBe(true);
  });

  it('requires a visa handover/file stage before visa preparation and decisions', () => {
    expect(validateApplicationStageTransition('CAS_RECEIVED', 'VISA_FILE_CREATED').ok).toBe(false);
    expect(validateApplicationStageTransition('CAS_RECEIVED', 'VISA_HANDOVER_READY').ok).toBe(true);
    expect(validateApplicationStageTransition('VISA_HANDOVER_READY', 'VISA_FILE_CREATED').ok).toBe(true);
    expect(validateApplicationStageTransition('VISA_HANDOVER_READY', 'VISA_PREPARATION').ok).toBe(false);
    expect(validateApplicationStageTransition('VISA_PREPARATION', 'VISA_APPROVED').ok).toBe(false);
    expect(validateApplicationStageTransition('VISA_SUBMITTED', 'VISA_APPROVED').ok).toBe(true);
  });

  it('keeps rejected, withdrawn, enrolled and closed applications terminal', () => {
    for (const terminal of ['REJECTED', 'WITHDRAWN', 'ENROLLED', 'CLOSED']) {
      expect(validateApplicationStageTransition(terminal, 'PROFILE_REVIEW').ok).toBe(false);
    }
  });
});
