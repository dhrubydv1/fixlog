"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import NotificationBell from "@/app/notification-bell";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="fl-brand" aria-label="FixLog home"><span className="fl-brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 18V6h11M7 12h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" /><path d="m13 17 2 2 4-4" stroke="currentColor" strokeWidth="1.8" /></svg></span><span>FixLog<span className="fl-brand-dot">.</span></span></Link>;
}

type HeaderProps = {
  workspace?: boolean;
  admin?: boolean;
  userName?: string;
  onNewFix?: () => void;
  onSignOut?: () => void;
  isSigningOut?: boolean;
};

export default function SiteHeader({ workspace = false, admin = false, userName, onNewFix, onSignOut, isSigningOut = false }: HeaderProps) {
  const pathname = usePathname();
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const accountMenu = useRef<HTMLDetailsElement>(null);
  const links = workspace
    ? [{ href: "/dashboard", label: "Dashboard" }, { href: "/community", label: "Community" }, { href: "/notifications", label: "Notifications" }, { href: "/settings", label: "Settings" }]
    : [{ href: "/", label: "Overview" }, { href: "/community", label: "Community" }];
  if (admin) links.push({ href: "/admin/reports", label: "Reports" });
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  function closeMenus() {
    if (mobileMenu.current) mobileMenu.current.open = false;
    if (accountMenu.current) accountMenu.current.open = false;
  }

  return (
    <header className="fl-site-header">
      <div className="fl-header-inner">
        <Brand href={workspace ? "/dashboard" : "/"} />
        <nav className="fl-desktop-nav" aria-label="Primary navigation">
          {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className="fl-nav-link">{label}</Link>)}
        </nav>
        <div className="fl-header-actions">
          {workspace ? <>
            <NotificationBell />
            <details ref={accountMenu} className="fl-menu" onKeyDown={(event) => { if (event.key === "Escape") { closeMenus(); accountMenu.current?.querySelector("summary")?.focus(); } }}>
              <summary className="fl-avatar" aria-label="Account menu">{userName?.trim().charAt(0).toUpperCase() || <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>}</summary>
              <div className="fl-menu-panel">
                {userName && <p className="fl-account-name">{userName}</p>}
                <Link href="/settings" onClick={closeMenus}>Account settings</Link>
                {onSignOut && <button type="button" onClick={() => { closeMenus(); onSignOut(); }} disabled={isSigningOut}>{isSigningOut ? "Logging out…" : "Log out"}</button>}
              </div>
            </details>
            {onNewFix && <button type="button" onClick={onNewFix} className="fl-button fl-button-primary"><span aria-hidden="true">+</span> New Fix</button>}
          </> : <><Link href="/auth" className="fl-nav-link fl-login-link">Log in</Link><Link href="/auth" className="fl-button fl-button-primary">Get started <span aria-hidden="true">↗</span></Link></>}
          <details ref={mobileMenu} className="fl-menu fl-mobile-menu" onKeyDown={(event) => { if (event.key === "Escape") { closeMenus(); mobileMenu.current?.querySelector("summary")?.focus(); } }}>
            <summary className="fl-menu-toggle" aria-label="Navigation menu"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 7h14M5 12h14M5 17h14" /></svg></summary>
            <nav className="fl-menu-panel" aria-label="Mobile navigation">
              {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={closeMenus}>{label}</Link>)}
              {!workspace && <Link href="/auth" onClick={closeMenus}>Log in</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
