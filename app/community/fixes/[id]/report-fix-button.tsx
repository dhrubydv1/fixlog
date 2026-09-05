"use client";

import Dialog from "@/app/components/dialog";
import { useState } from "react";

import { FIX_REPORT_REASONS, type FixReportReason } from "@/lib/fix-report-reasons";

const REPORT_REASON_LABELS: Record<FixReportReason, string> = {
  SECRET_EXPOSURE: "Secret exposure",
  SPAM: "Spam",
  ABUSIVE: "Abusive content",
  MISLEADING: "Misleading information",
  PRIVATE_INFORMATION: "Private information",
  OTHER: "Other",
};

export default function ReportFixButton({
  fixId,
  initialReported,
}: {
  fixId: number;
  initialReported: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<FixReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reported, setReported] = useState(initialReported);
  const [error, setError] = useState<string | null>(null);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason) {
      setError("Select a report reason.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/fixes/${fixId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const data: { reported?: boolean; error?: string } = await response.json();

      if (!response.ok || data.reported !== true) {
        throw new Error(data.error || "Unable to submit your report");
      }

      setReported(true);
      setIsOpen(false);
    } catch (reportError) {
      setError(
        reportError instanceof Error ? reportError.message : "Unable to submit your report",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (reported) {
    return <p role="status" className="mt-5 text-xs font-medium text-emerald-700">{initialReported ? "You already reported this Fix." : "Thanks. Your report has been submitted."}</p>;
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fl-button"
      >
        Report
      </button>
      {isOpen && (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Report this Fix" busy={isSubmitting}>
          <p>Help keep shared solutions useful. Reports are private and reviewed by moderation.</p>
          <form onSubmit={submitReport} className="mt-4 grid gap-4">
            <div className="grid gap-1.5"><label htmlFor="report-reason" className="text-sm font-medium text-zinc-800">Reason</label><select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value as FixReportReason | "")} required className="fl-field"><option value="">Select a reason</option>{FIX_REPORT_REASONS.map((option) => <option key={option} value={option}>{REPORT_REASON_LABELS[option]}</option>)}</select></div>
            <div className="grid gap-1.5"><label htmlFor="report-details" className="text-sm font-medium text-zinc-800">Details <span className="font-normal text-zinc-500">(optional)</span></label><textarea id="report-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={4} className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10" placeholder="Add context that may help with review." /><p className="text-xs text-zinc-500">{details.length}/1000</p></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button><button type="submit" disabled={isSubmitting} className="fl-button fl-button-primary">{isSubmitting ? "Submitting..." : "Submit report"}</button></div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
