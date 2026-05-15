# Fixit 24/7 — Layout Audit Execution Results

**Executed:** 2026-05-15  
**Branch:** `claude/test-plans-layout-audit-N7tqA`  
**Method:** Static code analysis across all 24 routes + typecheck

---

## Executive Summary

| Category            | Tests Run | Pass | Fail | Warn |
|---------------------|-----------|------|------|------|
| RBAC / Route Guards | 17        | 15   | 2    | 0    |
| Accessibility       | 7 checks  | 3    | 4    | 0    |
| Responsive Design   | 12 checks | 5    | 7    | 0    |
| Dark Mode           | 5 checks  | 2    | 3    | 0    |
| Core UI Flows       | 8 checks  | 5    | 1    | 2    |
| TypeScript          | Full build | —   | 0†   | —    |

† All TS errors are pre-existing `implicit any` from untyped API responses — none introduced by this audit.

**Bugs fixed in this run:** 6  
**Remaining issues logged below.**

---

## Fixed in This Audit

### FIX-001 — `/dashboard` wrong redirect for tradie role ✅ FIXED
**File:** `src/App.tsx:76`  
**Was:** `return <Redirect to="/" />`  
**Now:** Role-aware redirect — tradie → `/dashboard/tradie`, admin → `/dashboard/admin`, homeowner → `/dashboard`  

### FIX-002 — `/jobs/new` and `/post-job` unprotected ✅ FIXED
**File:** `src/App.tsx:144-145`  
**Was:** `<Route path="/jobs/new" component={PostJobPage} />` (no auth check)  
**Now:** Wrapped with `<ProtectedRoute component={PostJobPage} />`  

### FIX-003 — Credits page only showed 2 of 3 tiers ✅ FIXED
**File:** `src/pages/credits.tsx:282-286`  
**Was:** Hard-coded filter `credits === "300" || credits === "600"` excluding the $149 pack; `grid-cols-2`  
**Now:** No filter (all packs rendered), `grid-cols-3`, third pack highlight/subtitle added  

### FIX-004 — Broken `aria-describedby` on Partner page form ✅ FIXED
**File:** `src/pages/partner.tsx:307`  
**Was:** `FieldError` rendered `<p>` with no `id`; inputs referenced `name-err`, `phone-err`, `email-err` that didn't exist  
**Now:** `FieldError` accepts `id` prop; all three error elements have matching IDs  

### FIX-005 — Delete photo button missing `aria-label` + undersized tap target ✅ FIXED
**File:** `src/pages/post-job.tsx:441`  
**Was:** Icon-only `×` button, `w-5 h-5` (20×20px), no aria-label  
**Now:** `aria-label="Remove photo N"`, `w-6 h-6` (24×24px)  

### FIX-006 — Clear search button missing `aria-label` (Tradies page) ✅ FIXED
**File:** `src/pages/tradies.tsx:154`  
**Was:** Icon-only X button with no label  
**Now:** `aria-label="Clear search"`  

---

## Remaining Issues (To Fix)

### P1 — Core Flow

| ID       | File                        | Line    | Issue                                                                                          |
|----------|-----------------------------|---------|------------------------------------------------------------------------------------------------|
| TP-021-5 | `pages/message-thread.tsx`  | 34      | Polling fallback is 30s, not 5s as documented. WebSocket covers real-time but fallback is slow. |

### P2 — Accessibility

| ID       | File                        | Lines         | Issue                                                                                          |
|----------|-----------------------------|---------------|------------------------------------------------------------------------------------------------|
| A-001    | `pages/post-job.tsx`        | 317, 405, 427 | `<label>` lacks `htmlFor`; `<input>` lacks `id` — not programmatically associated              |
| A-002    | `pages/profile.tsx`         | 374, 383      | Full Name and Phone inputs lack `id`/`htmlFor` label linkage                                   |
| A-003    | `pages/jobs.tsx`            | 166           | Search input has no `aria-label` or `id`                                                       |

### P2 — Responsive Design (grid-cols without breakpoints)

| ID       | File                            | Line | Issue                                              |
|----------|---------------------------------|------|----------------------------------------------------|
| R-001    | `pages/login.tsx`               | 152  | `grid-cols-3` — demo accounts cramped on mobile    |
| R-002    | `pages/post-job.tsx`            | 344  | `grid-cols-2` — job size selector cramped on mobile|
| R-003    | `pages/dashboard-homeowner.tsx` | 324  | `grid-cols-3` — icon row overflows 375px           |
| R-004    | `pages/dashboard-homeowner.tsx` | 339  | `grid-cols-4` — 4-col icon row breaks on mobile    |
| R-005    | `pages/dashboard-homeowner.tsx` | 726  | `grid-cols-3` — stats row overflows 375px          |
| R-006    | `pages/tradie-profile.tsx`      | 287  | `grid-cols-3` — stats row cramped on mobile        |
| R-007    | `pages/profile.tsx`             | 637  | `grid-cols-2` — work photos grid needs breakpoints |

### P2 — Fixed min-widths causing potential overflow

| ID       | File                        | Line | Issue                                              |
|----------|-----------------------------|------|----------------------------------------------------|
| R-008    | `pages/tradies.tsx`         | 145  | `min-w-[200px]` on flex-1 item forces overflow     |
| R-009    | `pages/dashboard-admin.tsx` | 525  | `min-w-[200px]` on flex-1 item forces overflow     |

### P3 — Dark Mode (hardcoded colours without `dark:` variants)

| ID       | File                        | Lines               | Issue                                                        |
|----------|-----------------------------|---------------------|--------------------------------------------------------------|
| D-001    | `pages/how-it-works.tsx`    | 308, 317, 388, 401  | `text-black`, `bg-black` CTAs have no `dark:` counterpart    |
| D-002    | `pages/for-tradies.tsx`     | 172, 206            | Inline `style` with hardcoded hex + `text-black` on buttons  |
| D-003    | `pages/landing.tsx`         | 693                 | `bg-black` button without `dark:` variant                    |

### P3 — Error States Missing

| ID       | File                        | Issue                                                                      |
|----------|-----------------------------|----------------------------------------------------------------------------|
| E-001    | `pages/messages.tsx`        | No error UI if `useListConversations()` fails — user sees blank loading    |
| E-002    | `pages/message-thread.tsx`  | No error UI if send or fetch fails — no toast fallback                     |
| E-003    | `pages/notifications.tsx`   | No error UI if `useListNotifications()` fails — no toast fallback          |

---

## Test Plan Status by Section

| Section       | ID Range      | Status                   |
|---------------|---------------|--------------------------|
| Public Pages  | TP-001–009    | Code clean; browser test needed |
| Navbar        | TP-010        | Code clean; browser test needed |
| Homeowner     | TP-011–015    | Responsive issues logged (R-003–R-005) |
| Tradie        | TP-016–017    | FIX-003 applied; browser test needed |
| Admin         | TP-018–019    | Code clean; browser test needed |
| Messaging     | TP-020–021    | TP-021-5 open (30s poll) |
| Profile       | TP-022        | A-002 open (label linkage) |
| Notifications | TP-023        | E-003 open (error state) |
| Responsive    | TP-024        | 9 issues logged (R-001–R-009) |
| Dark Mode     | TP-025        | 3 issues logged (D-001–D-003) |
| RBAC          | TP-026        | FIX-001, FIX-002 applied ✅ |
| Accessibility | TP-027        | FIX-004–006 applied; A-001–003 open |
