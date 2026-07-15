import type { PatientInput } from '../fhir/types';

type PatientFormProps = {
  action: string;
  method?: 'post' | 'patch';
  values?: Partial<PatientInput>;
  errors?: Record<string, string>;
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
      id="patient-form"
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
        <select class="field" name="gender">
          {['', 'male', 'female', 'other', 'unknown'].map((gender) => (
            <option value={gender} selected={gender === props.values?.gender}>
              {gender || 'Select gender'}
            </option>
          ))}
        </select>
        {props.errors?.gender ? (
          <span class="text-xs text-red-700">{props.errors.gender}</span>
        ) : null}
      </label>
      <FormField
        name="birthDate"
        label="Date of birth"
        type="date"
        value={props.values?.birthDate}
        errors={props.errors}
      />
      <button class="button w-fit" type="submit">
        {props.submitLabel}
      </button>
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
  return (
    <label class="grid gap-1 text-sm font-medium text-slate-700">
      {props.label}
      <input
        class="field"
        name={props.name}
        type={props.type ?? 'text'}
        value={props.value ?? ''}
      />
      {props.errors?.[props.name] ? (
        <span class="text-xs text-red-700">{props.errors[props.name]}</span>
      ) : null}
    </label>
  );
}
