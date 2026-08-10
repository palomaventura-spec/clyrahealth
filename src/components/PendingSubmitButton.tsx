"use client";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  idle, pending, className = "btn btn-primary", disabled = false
}: { idle: string; pending: string; className?: string; disabled?: boolean }) {
  const status = useFormStatus();
  return <button type="submit" className={className} disabled={disabled || status.pending} aria-busy={status.pending}>
    {status.pending && <span className="button-spinner" aria-hidden="true"/>}
    {status.pending ? pending : idle}
  </button>;
}
