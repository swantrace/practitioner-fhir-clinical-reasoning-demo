export {};

const DIALOG_ID = 'patient-create-dialog';
const TOAST_ID = 'patient-created-toast';
let opener: HTMLElement | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function setupPatientDialog() {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const openButton = event.target.closest<HTMLElement>(
      '[data-open-patient-dialog]',
    );
    if (openButton) {
      const dialog = patientDialog();
      if (!dialog || dialog.open) return;

      opener = openButton;
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('[name="firstName"]')?.focus();
      return;
    }

    if (event.target.closest('[data-close-patient-dialog]')) {
      patientDialog()?.close();
    }
  });

  patientDialog()?.addEventListener('close', () => {
    resetPatientForm();
    opener?.focus();
    opener = undefined;
  });

  document.body.addEventListener('htmx:afterSwap', () => {
    const dialog = patientDialog();
    if (!dialog?.open) return;

    dialog
      .querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')
      ?.focus();
  });

  document.body.addEventListener('patient-created', (event) => {
    const detail = (event as CustomEvent<{ message?: string }>).detail;
    patientDialog()?.close();
    showToast(detail?.message ?? 'Patient created successfully.');
  });
}

function resetPatientForm() {
  const form = document.querySelector<HTMLFormElement>('#patient-create-form');
  if (!form) return;

  form.reset();
  form
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach((field) => {
      field.value = '';
      field.removeAttribute('aria-describedby');
      field.removeAttribute('aria-invalid');
    });
  document
    .querySelectorAll('#patient-create-content [data-form-error]')
    .forEach((error) => error.remove());
}

function patientDialog() {
  return document.querySelector<HTMLDialogElement>(`#${DIALOG_ID}`);
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLElement>(`#${TOAST_ID}`);
  if (!toast) return;

  const messageElement = toast.querySelector('[data-toast-message]');
  if (messageElement) messageElement.textContent = message;
  toast.hidden = false;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 5_000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPatientDialog, {
    once: true,
  });
} else {
  setupPatientDialog();
}
