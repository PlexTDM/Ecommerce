import type { ReactNode } from "react";
import AdminDialog from "./AdminDialog";
import Spinner from "./Spinner";
import { AlertIcon, TrashIcon } from "./icons";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Delete",
  busyLabel = "Deleting...",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <AdminDialog title={title} onClose={onCancel} busy={busy}>
    <div className="flex items-start gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
        <TrashIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-sm text-rose-100/80">{message}</div>
    </div>

    {error && (
      <div
        role="alert"
        className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
      >
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        data-autofocus
        onClick={onCancel}
        disabled={busy}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          void onConfirm();
        }}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && <Spinner className="h-4 w-4" />}
        {busy ? busyLabel : confirmLabel}
      </button>
    </div>
  </AdminDialog>
);

export default ConfirmDialog;
