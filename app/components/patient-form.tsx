import type { PatientInput } from '../fhir/types';

type PatientFormProps = {
  action: string;
  method?: 'post' | 'patch';
  values?: Partial<PatientInput>;
  errors?: Record<string, string>;
  formId?: string;
  showCancel?: boolean;
  submitLabel: string;
  target?: string;
};

export function PatientForm(props: PatientFormProps) {
  const method = props.method ?? 'post';

  return (
    <form
      class="grid gap-3 rounded-md border border-slate-200 bg-white p-4"
      hx-post={method === 'post' ? props.action : undefined}
      hx-patch={method === 'patch' ? props.action : undefined}
      hx-target={props.target ?? '#patient-form'}
      hx-swap="outerHTML"
      id={props.formId ?? 'patient-form'}
      method="post"
      action={props.action}
    >
      <FormField
        name="firstName"
        label="First name"
        value={props.values?.firstName}
        errors={props.errors}
      />
      <FormField
        name="lastName"
        label="Last name"
        value={props.values?.lastName}
        errors={props.errors}
      />
      <label class="grid gap-1 text-sm font-medium text-slate-700">
        Gender
        <select
          aria-describedby={props.errors?.gender ? 'gender-error' : undefined}
          aria-invalid={props.errors?.gender ? 'true' : undefined}
          class="field"
          name="gender"
          required
        >
          {['', 'male', 'female', 'other', 'unknown'].map((gender) => (
            <option value={gender} selected={gender === props.values?.gender}>
              {gender || 'Select gender'}
            </option>
          ))}
        </select>
        {props.errors?.gender ? (
          <span class="text-xs text-red-700" data-form-error id="gender-error">
            {props.errors.gender}
          </span>
        ) : null}
      </label>
      <FormField
        name="birthDate"
        label="Date of birth"
        type="date"
        value={props.values?.birthDate}
        errors={props.errors}
      />
      <div class="flex flex-wrap gap-2">
        <button class="button" type="submit">
          {props.submitLabel}
        </button>
        {props.showCancel ? (
          <button
            class="button-secondary"
            data-close-patient-dialog
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function FormField(props: {
  name: keyof PatientInput;
  label: string;
  type?: string;
  value?: string;
  errors?: Record<string, string>;
}) {
  const errorId = `${props.name}-error`;

  return (
    <label class="grid gap-1 text-sm font-medium text-slate-700">
      {props.label}
      <input
        aria-describedby={props.errors?.[props.name] ? errorId : undefined}
        aria-invalid={props.errors?.[props.name] ? 'true' : undefined}
        class="field"
        max={props.type === 'date' ? today() : undefined}
        name={props.name}
        required
        type={props.type ?? 'text'}
        value={props.value ?? ''}
      />
      {props.errors?.[props.name] ? (
        <span class="text-xs text-red-700" data-form-error id={errorId}>
          {props.errors[props.name]}
        </span>
      ) : null}
    </label>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
