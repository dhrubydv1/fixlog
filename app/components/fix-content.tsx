import CopyButton from "@/app/components/copy-button";

export default function FixContent({ problem, errorMessage, cause, solution }: { problem: string; errorMessage: string | null; cause: string | null; solution: string }) {
  return <dl className="fl-fix-content">
    <div className="fl-reading-section"><dt>01 <span>Problem</span></dt><dd>{problem}</dd></div>
    <div className="fl-reading-section"><dt>02 <span>Error message</span></dt><dd>{errorMessage ? <div className="fl-code-block"><div className="fl-code-toolbar"><span>ERROR OUTPUT</span><CopyButton text={errorMessage} label="Error message" /></div><pre>{errorMessage}</pre></div> : <span className="fl-muted">No error message provided.</span>}</dd></div>
    <div className="fl-reading-section"><dt>03 <span>Cause</span></dt><dd>{cause || <span className="fl-muted">No cause documented.</span>}</dd></div>
    <div className="fl-reading-section fl-solution"><dt>04 <span>Solution</span><CopyButton text={solution} label="Solution" /></dt><dd>{solution}</dd></div>
  </dl>;
}
