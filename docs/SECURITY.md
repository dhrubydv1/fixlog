# FixLog security and privacy

## Ownership

Every Fix has a server-assigned `userId`. Create, edit, delete, favorite, and visibility changes require the current session user to own the Fix. Browser payloads cannot set ownership, timestamps, session values, or account metadata.

## Private and public visibility

Private Fixes are excluded server-side from Community Hub, Community Search, public profiles, public pages, votes, reports, and saves. Public Fix pages are read-only for everyone except the owner’s private workspace. Changing a Fix back to private removes its public access in application queries.

## Community actions

Helpful votes and reports require authentication, public visibility, and non-owner access. Unique constraints prevent duplicate votes and reports. Saved community Fixes are independent copies with a new owner and private visibility.

## Admin authorization

Admin pages and moderation APIs re-check the signed-in email against the server-only `ADMIN_EMAILS` allowlist. Normal users receive a safe not-found response. The allowlist is never exposed to the browser.

## Secrets and public data

OpenRouter and Resend keys stay server-side. Public pages expose only safe Fix content, timestamps, category/tags, helpful totals, and optional display names. They never expose email addresses, sessions, accounts, passwords, or verification metadata. Reports and reporter identity remain private.
