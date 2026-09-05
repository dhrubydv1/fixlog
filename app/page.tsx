import Link from "next/link";
import SiteHeader, { Brand } from "@/app/components/site-header";

const features = [
  { number: "01", title: "Capture the whole story", description: "Keep the problem, error, cause, and solution together. Turn a hard-won fix into a clear record you can actually reuse.", detail: "Problems · Causes · Solutions" },
  { number: "02", title: "Find your way back", description: "Search by keyword or meaning. Use categories, tags, and favorites to find the answer while you’re still in the flow.", detail: "Search · Similar Fixes · Favorites" },
  { number: "03", title: "Learn from other builders", description: "Explore public solutions, discover helpful developers, and save useful community Fixes into your own workspace.", detail: "Community · Helpful votes · Public profiles" },
];

export default function Home() {
  return <main className="fl-page fl-landing">
    <SiteHeader />
    <div className="fl-container">
      <section className="fl-hero" aria-labelledby="hero-heading">
        <div className="fl-hero-copy">
          <p className="fl-eyebrow"><span className="fl-status-dot" /> Your developer memory</p>
          <h1 id="hero-heading">Solve it once.<br /><span>Keep it for<br className="hidden lg:block" /> next time.</span></h1>
          <p>That error you spent hours on? Give the solution a home. Save your fixes, find them faster, and get back to building.</p>
          <div className="fl-actions mt-7"><Link href="/auth" className="fl-button fl-button-primary">Start your FixLog <span aria-hidden="true">↗</span></Link><Link href="/community" className="fl-button">Explore community</Link></div>
          <p className="fl-hero-note">Private by default. Shared when you choose.</p>
        </div>
        <ProductPreview />
      </section>
      <section id="features" className="fl-landing-section" aria-labelledby="features-heading">
        <div className="fl-landing-section-heading"><p className="fl-eyebrow">A better habit for debugging</p><h2 id="features-heading">Less rediscovering.<br />More moving forward.</h2><p>Your debugging knowledge deserves more than an old tab, a lost note, or a half-remembered command.</p></div>
        <div className="fl-feature-grid">{features.map((feature) => <article key={feature.number} className="fl-feature"><span className="fl-feature-number">{feature.number}</span><h3>{feature.title}</h3><p>{feature.description}</p><span className="fl-feature-detail">{feature.detail}</span></article>)}</div>
      </section>
      <section className="fl-ai-section" aria-labelledby="ai-heading">
        <div><p className="fl-eyebrow">A little help from AI</p><h2 id="ai-heading">From rough context<br />to a useful draft.</h2><p>Paste an error or describe the problem. FixLog can suggest a title, cause, solution, category, and tags. Review the draft, make it yours, and save when you’re ready.</p><Link href="/auth" className="fl-button mt-6">Try your first Fix <span aria-hidden="true">↗</span></Link></div>
        <div className="fl-ai-preview"><div className="fl-code-toolbar"><span>YOUR CONTEXT</span><span>01</span></div><p className="font-mono text-xs leading-7">Prisma can’t connect to Neon on Vercel.</p><div className="fl-code-toolbar"><span>A DRAFT TO REVIEW</span><span>02</span></div><dl><dt>Title</dt><dd>Prisma connection on Vercel</dd><dt>Category</dt><dd><span className="fl-badge">Database</span></dd><dt>Next step</dt><dd>Review the suggested cause and solution before saving.</dd></dl><span className="fl-ai-preview-note">You stay in control of every saved Fix.</span></div>
      </section>
      <section id="how-it-works" className="fl-landing-section" aria-labelledby="how-heading">
        <div className="fl-landing-section-heading"><p className="fl-eyebrow">Simple enough to become a habit</p><h2 id="how-heading">Fix. Document. Remember.</h2></div>
        <ol className="fl-steps">{[["01", "Solve something", "Work through the problem and confirm what fixed it."], ["02", "Save the context", "Capture the details while the solution is still fresh."], ["03", "Find it again", "Search your own knowledge the next time it happens."]].map(([step, title, text]) => <li key={step}><span>{step}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section className="fl-landing-cta" aria-labelledby="cta-heading"><div><p className="fl-eyebrow">Your next fix is worth remembering</p><h2 id="cta-heading">Build your own library of solved.</h2><p>A personal workspace, with the option to share what helps.</p></div><Link href="/auth" className="fl-button fl-button-primary">Create your FixLog <span aria-hidden="true">↗</span></Link></section>
    </div>
    <footer className="fl-landing-footer"><Brand /><p>A little less debugging. A little more building.</p><div className="fl-actions"><Link href="/community">Community</Link><Link href="/auth">Log in</Link><span>© {new Date().getFullYear()} FixLog</span></div></footer>
  </main>;
}

function ProductPreview() {
  return <div className="fl-product-preview" aria-label="Illustrative FixLog workspace preview">
    <div className="fl-preview-top"><span><span className="fl-preview-square" /> Workspace preview</span><span className="fl-badge">Private workspace</span></div>
    <div className="fl-preview-content"><div className="fl-preview-sidebar"><span className="fl-preview-active">All Fixes <span>18</span></span><span>Favorites <span>4</span></span><p>CATEGORIES</p><span>Database</span><span>Deployment</span><span>Authentication</span></div><div className="fl-preview-main"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Your Fixes</p><span className="text-[10px] text-zinc-500">18 saved solutions</span></div><div className="fl-preview-search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>Search your fixes…<span>⌘ K</span></div><div className="fl-preview-fix"><div className="flex items-center justify-between"><span className="fl-badge">Database</span><span className="text-amber-600">★</span></div><h3>Prisma connection on Vercel</h3><p>A connection timeout after deploying the app.</p><div className="fl-preview-code">P1001: Can’t reach database server</div><div className="fl-preview-solution"><span aria-hidden="true">✓</span><span>Solution documented and saved</span></div><div className="fl-preview-tags"><span>#prisma</span><span>#vercel</span><span>Updated today</span></div></div><div className="fl-preview-mini"><span className="fl-preview-mini-icon">↗</span><div><h3>Resolve a Git merge conflict</h3><p>Git/GitHub · 2 days ago</p></div></div></div></div>
    <div className="fl-preview-bottom"><span className="fl-status-dot" /> The fix you need, right where you left it.</div>
  </div>;
}
