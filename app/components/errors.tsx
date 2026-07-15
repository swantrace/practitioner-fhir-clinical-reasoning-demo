export function ErrorState(props: { message: string }) {
  return (
    <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {props.message}
    </div>
  );
}

export function EmptyState(props: { message: string }) {
  return (
    <div class="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
      {props.message}
    </div>
  );
}
