type BloodPressureFormProps = {
  patientId: string;
  values?: Partial<Record<'systolic' | 'diastolic', string>>;
  errors?: Record<string, string>;
};

export function BloodPressureForm(props: BloodPressureFormProps) {
  const action = `/api/patients/${encodeURIComponent(props.patientId)}/blood-pressure`;

  return (
    <form
      action={action}
      class="mt-3 grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3"
      hx-disabled-elt="find button"
      hx-post={action}
      hx-swap="outerHTML"
      hx-target="this"
      method="post"
    >
      <div>
        <h4 class="text-sm font-semibold text-slate-900">
          Record blood pressure
        </h4>
        <p class="mt-1 text-xs text-slate-600">
          The measurement time will be recorded when this form is submitted.
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <PressureField
          error={props.errors?.systolic}
          label="Systolic"
          name="systolic"
          value={props.values?.systolic}
        />
        <PressureField
          error={props.errors?.diastolic}
          label="Diastolic"
          name="diastolic"
          value={props.values?.diastolic}
        />
      </div>
      <button class="button w-fit" type="submit">
        Save observation
      </button>
    </form>
  );
}

export function BloodPressureRecorded(props: {
  observation: fhir4.Observation;
}) {
  const systolic = componentValue(props.observation, '8480-6');
  const diastolic = componentValue(props.observation, '8462-4');

  return (
    <div
      class="mt-3 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
      role="status"
    >
      Blood pressure {systolic}/{diastolic} mmHg was recorded. Re-evaluating
      clinical decision support.
    </div>
  );
}

function PressureField(props: {
  name: 'systolic' | 'diastolic';
  label: string;
  value?: string;
  error?: string;
}) {
  return (
    <label class="grid gap-1 text-sm font-medium text-slate-700">
      {props.label} (mmHg)
      <input
        aria-invalid={props.error ? 'true' : undefined}
        class="field"
        inputmode="numeric"
        max={props.name === 'systolic' ? 300 : 200}
        min={props.name === 'systolic' ? 50 : 30}
        name={props.name}
        required
        step="1"
        type="number"
        value={props.value ?? ''}
      />
      {props.error ? (
        <span class="text-xs text-red-700">{props.error}</span>
      ) : null}
    </label>
  );
}

function componentValue(observation: fhir4.Observation, code: string) {
  return (
    observation.component?.find((item) =>
      item.code.coding?.some((coding) => coding.code === code),
    )?.valueQuantity?.value ?? '?'
  );
}
