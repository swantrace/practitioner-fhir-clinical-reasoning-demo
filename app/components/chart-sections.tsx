import { codeText, observationValue } from '../fhir/format';
import { EmptyState } from './errors';
import { VitalSignOverview } from './vital-sign-trends';

export function VitalSigns(props: {
  observations: fhir4.Observation[];
  patientId?: string;
}) {
  return (
    <section
      class="grid gap-3"
      hx-get={
        props.patientId
          ? `/api/patients/${encodeURIComponent(props.patientId)}/vital-signs`
          : undefined
      }
      hx-swap="outerHTML"
      hx-trigger={
        props.patientId ? 'blood-pressure-recorded from:body' : undefined
      }
      id={props.patientId ? 'vital-signs' : undefined}
    >
      <h2 class="section-title">Vital signs</h2>
      {!props.observations.length ? (
        <EmptyState message="No vital signs found." />
      ) : (
        <>
          <VitalSignOverview observations={props.observations} />
          <details class="rounded-md border border-slate-200 bg-white">
            <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-teal-700">
              View all {props.observations.length} recorded observations
            </summary>
            <div class="border-t border-slate-200">
              <Rows
                rows={props.observations.map((item) => [
                  codeText(item),
                  observationValue(item),
                  item.effectiveDateTime,
                ])}
                unframed
              />
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export function Conditions(props: { conditions: fhir4.Condition[] }) {
  return (
    <Section title="Active conditions">
      {!props.conditions.length ? (
        <EmptyState message="No active conditions found." />
      ) : (
        <Rows
          rows={props.conditions.map((item) => [
            codeText(item),
            item.clinicalStatus?.coding?.[0]?.code,
            onset(item),
          ])}
        />
      )}
    </Section>
  );
}

export function Medications(props: { medications: fhir4.MedicationRequest[] }) {
  return (
    <Section title="Active medications">
      {!props.medications.length ? (
        <EmptyState message="No active medications found." />
      ) : (
        <Rows
          rows={props.medications.map((item) => [
            codeText(item),
            item.status,
            item.dosageInstruction?.[0]?.text,
          ])}
        />
      )}
    </Section>
  );
}

function Section(props: { title: string; children: unknown }) {
  return (
    <section class="grid gap-3">
      <h2 class="section-title">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Rows(props: {
  rows: Array<Array<string | undefined>>;
  unframed?: boolean;
}) {
  return (
    <div
      class={
        props.unframed
          ? 'overflow-x-auto'
          : 'overflow-hidden rounded-md border border-slate-200 bg-white'
      }
    >
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <tbody class="divide-y divide-slate-100">
          {props.rows.map(([name, status, detail]) => (
            <tr>
              <td class="px-4 py-3 font-medium">{name ?? 'Unknown'}</td>
              <td class="px-4 py-3">{status ?? 'Not recorded'}</td>
              <td class="px-4 py-3 text-slate-600">{detail ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function onset(condition: fhir4.Condition) {
  return condition.onsetDateTime ?? condition.recordedDate ?? undefined;
}
