'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, inputClass, useApi } from '../ui';

interface ProfileView {
  id: string;
  completion: number;
  onboardingStep: number;
  fields: Record<string, string | string[] | Date | null>;
}

const REQUIRED_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'highestQualification', label: 'Highest qualification' },
  { key: 'degreeSubject', label: 'Degree subject' },
  { key: 'awardingInstitution', label: 'Awarding institution' },
  { key: 'classification', label: 'Classification or grade' },
  { key: 'primaryDiscipline', label: 'Primary discipline' },
  { key: 'preferredMethods', label: 'Preferred research methods' },
  { key: 'studyMode', label: 'Study mode' },
  { key: 'fundingRequirement', label: 'Funding requirement' },
  { key: 'currentStage', label: 'Current stage' },
];

const TEXT_FIELDS = [
  'highestQualification',
  'degreeSubject',
  'awardingInstitution',
  'classification',
  'dissertationTitle',
  'relevantModules',
  'researchExperience',
  'publications',
  'researchSetting',
  'existingResearchIdea',
  'desiredStart',
  'englishTestType',
  'englishTestScore',
] as const;

const DISCIPLINES = ['BUSINESS', 'ENGINEERING', 'BOTH', 'UNDECIDED'];
const STUDY_MODES = ['FULL_TIME', 'PART_TIME', 'UNDECIDED'];
const FUNDING = ['REQUIRED', 'PREFERRED', 'SELF_FUNDED', 'UNDECIDED'];
const STAGES = ['TOPIC_DISCOVERY', 'PROPOSAL_DEVELOPMENT', 'SUPERVISOR_OUTREACH', 'APPLICATION_PREPARATION', 'OFFER_RECEIVED'];

export default function ProfilePanel() {
  const { data, error, loading, reload } = useApi<{ profile: ProfileView }>('/api/phd/profile');
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const fields = data?.profile?.fields;
    if (!fields) return;
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      next[key] = Array.isArray(value) ? value.join(', ') : value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');
    }
    setDraft(next);
  }, [data]);

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const missing = REQUIRED_FIELDS.filter((field) => !String(draft[field.key] ?? '').trim());

  async function save() {
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {};
      for (const key of TEXT_FIELDS) payload[key] = draft[key] ?? '';
      for (const key of ['primaryDiscipline', 'studyMode', 'fundingRequirement', 'currentStage', 'englishTestStatus']) {
        if (draft[key]) payload[key] = draft[key];
      }
      await apiSend('/api/phd/profile', 'PUT', payload);
      setSaved(true);
      await reload();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'The profile could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Loading your academic profile…" />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Empty title="No profile" hint="Reload the page to try again." />;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Profile completeness" description="Only fields you provide are used to shape topic and supervisor suggestions.">
        <p className="text-3xl font-bold text-[var(--alo-text)]">{data.profile.completion}%</p>
        {missing.length > 0 ? (
          <>
            <p className="mt-2 text-xs font-semibold text-[var(--alo-text)]">Still missing</p>
            <ul className="mt-1 space-y-1 text-xs text-[var(--alo-body)]">
              {missing.map((field) => (
                <li key={field.key}>• {field.label}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-xs text-emerald-700">All core fields are complete.</p>
        )}
        <p className="mt-4 text-[11px] text-[var(--alo-text-muted)]">
          Sensitive or optional fields stay optional. Nothing here is sent to a university automatically.
        </p>
      </Card>

      <Card title="Academic background" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Highest qualification">
            <input className={inputClass} value={draft.highestQualification ?? ''} onChange={set('highestQualification')} />
          </Field>
          <Field label="Degree subject">
            <input className={inputClass} value={draft.degreeSubject ?? ''} onChange={set('degreeSubject')} />
          </Field>
          <Field label="Awarding institution">
            <input className={inputClass} value={draft.awardingInstitution ?? ''} onChange={set('awardingInstitution')} />
          </Field>
          <Field label="Classification / grade">
            <input className={inputClass} value={draft.classification ?? ''} onChange={set('classification')} />
          </Field>
          <Field label="Dissertation title">
            <input className={inputClass} value={draft.dissertationTitle ?? ''} onChange={set('dissertationTitle')} />
          </Field>
          <Field label="English test">
            <select className={inputClass} value={draft.englishTestStatus ?? 'UNKNOWN'} onChange={set('englishTestStatus')}>
              <option value="UNKNOWN">Not recorded</option>
              <option value="NOT_TAKEN">Not taken</option>
              <option value="TAKEN">Taken</option>
              <option value="EXEMPT">Exempt</option>
            </select>
          </Field>
          <Field label="English test type">
            <input className={inputClass} value={draft.englishTestType ?? ''} onChange={set('englishTestType')} placeholder="IELTS / TOEFL / PTE" />
          </Field>
          <Field label="English test score">
            <input className={inputClass} value={draft.englishTestScore ?? ''} onChange={set('englishTestScore')} />
          </Field>
        </div>

        <div className="mt-3 grid gap-3">
          <Field label="Relevant modules" hint="One per line or a short paragraph.">
            <textarea className={inputClass} rows={3} value={draft.relevantModules ?? ''} onChange={set('relevantModules')} />
          </Field>
          <Field label="Research experience">
            <textarea className={inputClass} rows={3} value={draft.researchExperience ?? ''} onChange={set('researchExperience')} />
          </Field>
          <Field label="Publications and conference papers" hint="Only list work that exists — this is never invented for you.">
            <textarea className={inputClass} rows={2} value={draft.publications ?? ''} onChange={set('publications')} />
          </Field>
        </div>
      </Card>

      <Card title="Research preferences" className="lg:col-span-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Discipline">
            <select className={inputClass} value={draft.primaryDiscipline ?? 'UNDECIDED'} onChange={set('primaryDiscipline')}>
              {DISCIPLINES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0) + value.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Study mode">
            <select className={inputClass} value={draft.studyMode ?? 'UNDECIDED'} onChange={set('studyMode')}>
              {STUDY_MODES.map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Funding requirement">
            <select className={inputClass} value={draft.fundingRequirement ?? 'UNDECIDED'} onChange={set('fundingRequirement')}>
              {FUNDING.map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current stage">
            <select className={inputClass} value={draft.currentStage ?? 'TOPIC_DISCOVERY'} onChange={set('currentStage')}>
              {STAGES.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desired start">
            <input className={inputClass} value={draft.desiredStart ?? ''} onChange={set('desiredStart')} placeholder="September 2027" />
          </Field>
          <Field label="Research setting / population" hint="Industry, sector, technology or geography you want to study.">
            <input className={inputClass} value={draft.researchSetting ?? ''} onChange={set('researchSetting')} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Existing research idea" hint="Leave blank if you do not have one yet; discovery will still work.">
            <textarea className={inputClass} rows={3} value={draft.existingResearchIdea ?? ''} onChange={set('existingResearchIdea')} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
          {saved && <Pill tone="ok">Saved</Pill>}
          {saveError && <span className="text-xs text-red-700">{saveError}</span>}
        </div>
      </Card>
    </div>
  );
}
