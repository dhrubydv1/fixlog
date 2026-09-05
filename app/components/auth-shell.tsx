import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/app/components/site-header";

export default function AuthShell({ children }: { children: ReactNode }) {
  return <main className="fl-page fl-auth-page"><header className="fl-auth-nav"><Brand /><Link href="/community" className="fl-nav-link">Explore the community <span aria-hidden="true">↗</span></Link></header><div className="fl-auth-layout"><aside className="fl-auth-story"><p className="fl-eyebrow">A little less debugging. A little more building.</p><h2>Your next answer<br />might already<br />be in your FixLog.</h2><p>Keep the context, the cause, and the solution. Build a personal library of things you know how to fix.</p><div className="fl-auth-example"><span className="fl-badge">Database</span><h3>That connection error?<br />Already solved.</h3><div><span aria-hidden="true">✓</span> Problem documented</div><div><span aria-hidden="true">✓</span> Solution saved</div><div><span aria-hidden="true">✓</span> Ready for next time</div></div><p className="fl-auth-footnote">Private by default. Shared when you choose.</p></aside><div className="fl-auth-form-wrap">{children}</div></div></main>;
}
