# FixLog testing guide

## Automated validation

```bash
npm run lint
npx tsc --noEmit
npm run test -- tests/notifications.test.mjs
npm run build
```

The notification test covers session scoping, unread counts, mark-as-read ownership, helpful/save notifications, moderation notifications, race handling, and transaction rollback behavior.

## Two-user manual matrix

With disposable User A and User B accounts:

1. Create a private Fix for A. Confirm B cannot view, search, vote, report, save, edit, or delete it.
2. Make it public. Confirm B can view, search, vote, report, and save it, but cannot modify A’s original.
3. Make it private again. Confirm the public page, Hub, and community search stop returning it.
4. Confirm B’s saved copy has a different ID, belongs to B, and remains private and independent.

## Admin checks

Configure one admin email in `ADMIN_EMAILS`. Verify normal users receive safe 404 responses, while the admin can review reports and Keep, Hide, or Delete a public Fix. Confirm Hide makes the Fix private and Delete cascades dependent data.

## AI and email checks

Test configured and unconfigured OpenRouter states, rate limits, timeouts, malformed model output, and safe user-facing errors. Test signup verification and password reset with a permitted Resend recipient. Delivery restrictions from Resend’s testing sender are provider limitations, not necessarily application failures.

## Responsive and accessibility checks

Review 375px, 768px, 1024px, and 1440px layouts for navigation, forms, filters, cards, dialogs, community pages, settings, notifications, and admin reports. Confirm visible keyboard focus, labelled inputs, password show/hide labels, Escape-to-close dialogs where implemented, understandable status messages, and confirmation for destructive actions.
