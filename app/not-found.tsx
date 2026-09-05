import Link from "next/link";
import SiteHeader from "@/app/components/site-header";

export default function NotFound() {
  return <main className="fl-page"><SiteHeader /><div className="fl-container fl-container-narrow"><section className="fl-not-found" aria-labelledby="not-found-heading"><p className="fl-eyebrow">404 · Page not found</p><span className="fl-not-found-mark" aria-hidden="true">[ ? ]</span><h1 id="not-found-heading">This page is out of reach.</h1><p>The page may have moved, or you may not have access to it.</p><div className="fl-actions mt-7"><Link href="/" className="fl-button fl-button-primary">Return to FixLog</Link><Link href="/community" className="fl-button">Explore community</Link></div></section></div></main>;
}
