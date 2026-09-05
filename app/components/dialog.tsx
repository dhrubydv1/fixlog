"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function Dialog({ open, onClose, title, children, busy = false, danger = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; busy?: boolean; danger?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-dialog-cancel]")?.focus();
    return () => { dialog.close(); };
  }, [open]);

  return <dialog ref={dialogRef} className={`fl-dialog${danger ? " fl-dialog-danger" : ""}`} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="fl-dialog-heading"><h2>{title}</h2><button type="button" className="fl-icon-button" aria-label="Close dialog" data-dialog-cancel disabled={busy} onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}
