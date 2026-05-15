# Fixit 24/7 — Full App Layout Audit Test Plan

**Figma Navigation Map:** https://www.figma.com/board/8PwHBU7VwiD0LN7xqlg1hT  
**Figma Test Schedule:** https://www.figma.com/board/Hb0Qz7CmVUlMyl8rrW9Gjf  
**Scope:** Every route in `artifacts/fixit247/src` — layout, responsiveness, role access, dark/light mode, accessibility  
**Browsers:** Chrome 124+, Firefox 126+, Safari 17+ (desktop); Chrome Mobile, Safari iOS (mobile)  
**Viewports:** 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide)

---

## Test Credentials

| Role      | Email                       | Password    |
|-----------|-----------------------------|-------------|
| Homeowner | homeowner@fixit247.com      | password123 |
| Tradie    | tradie@fixit247.com         | password123 |
| Admin     | admin@fixit247.com          | admin123    |

---

## Section 1 — Public Pages

### TP-001 Landing Page (`/`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-001-1 | Load `/` unauthenticated                                     | Hero section, CTAs (Get Started, How It Works) visible              |           |
| TP-001-2 | Load `/` as homeowner                                        | Redirects or renders homeowner dashboard inline                     |           |
| TP-001-3 | Load `/` as tradie                                           | Redirects or renders tradie dashboard inline                        |           |
| TP-001-4 | Hero CTA "Get Started" click                                 | Navigates to `/register`                                            |           |
| TP-001-5 | Footer links render and navigate correctly                   | All footer links resolve without 404                                |           |
| TP-001-6 | Mobile (375px): hero text does not overflow viewport         | No horizontal scroll, text readable                                 |           |
| TP-001-7 | Dark mode toggle on landing                                  | Background/text colours invert correctly, no white flash            |           |

### TP-002 Login Page (`/login`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-002-1 | Form fields (email, password) render correctly               | Labels, placeholders, and input borders visible                     |           |
| TP-002-2 | Demo credentials section visible                             | Three role cards shown with "Use" buttons                           |           |
| TP-002-3 | Submit with empty fields                                     | Inline validation errors shown, no network request fired            |           |
| TP-002-4 | Submit with wrong credentials                                | Error toast/message displayed                                       |           |
| TP-002-5 | Login as homeowner → redirect to `/dashboard`                | Homeowner dashboard loads                                           |           |
| TP-002-6 | Login as tradie → redirect to `/dashboard/tradie`            | Tradie dashboard loads                                              |           |
| TP-002-7 | Login as admin → redirect to `/dashboard/admin`              | Admin dashboard loads                                               |           |
| TP-002-8 | Navbar is hidden on `/login`                                 | No top navbar rendered                                              |           |
| TP-002-9 | Mobile (375px): form full-width, no overflow                 | Input fields span available width                                   |           |

### TP-003 Register Page (`/register`, `/signup`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-003-1 | Role selector (homeowner/tradie) renders                     | Two options visible and selectable                                  |           |
| TP-003-2 | Tradie-specific fields appear when tradie selected           | Trade, ABN, service area fields visible                             |           |
| TP-003-3 | Submit with missing required fields                          | Validation errors per field                                         |           |
| TP-003-4 | Successful registration redirects to appropriate dashboard   | Role-based dashboard loads                                          |           |
| TP-003-5 | Navbar hidden on `/register`                                 | No top navbar                                                       |           |
| TP-003-6 | `/signup` alias resolves to same page                        | Same form renders at `/signup`                                      |           |

### TP-004 How It Works (`/how-it-works`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-004-1 | Page loads and renders step-by-step sections                 | Steps numbered and clearly laid out                                 |           |
| TP-004-2 | Images/icons load without broken src                         | No broken image icons                                               |           |
| TP-004-3 | CTA buttons navigate correctly                               | "Post a Job" / "Join as Tradie" go to correct routes                |           |
| TP-004-4 | Mobile: steps stack vertically                               | No horizontal overflow                                              |           |

### TP-005 Emergency Page (`/emergency`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-005-1 | Fixit 24/7 Plus pricing renders correctly                    | $49/month plan card visible                                         |           |
| TP-005-2 | Stripe subscribe button visible for homeowners               | CTA triggers Stripe checkout or redirects to login                  |           |
| TP-005-3 | Emergency membership badge shows for active members          | Badge/status indicator visible if membership active                 |           |
| TP-005-4 | Mobile layout: pricing card full-width                       | No card overflow on 375px                                           |           |

### TP-006 For Tradies Page (`/for-tradies`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-006-1 | Hero section and value props render                          | At least 3 value proposition blocks visible                         |           |
| TP-006-2 | "Sign Up as Tradie" CTA navigates to `/register`             | Register page loads with tradie role pre-selected (if applicable)   |           |
| TP-006-3 | Mobile layout: value props stack correctly                   | Single-column layout on mobile                                      |           |

### TP-007 Categories Page (`/categories`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-007-1 | All service categories listed                                | Grid/list of categories renders                                     |           |
| TP-007-2 | Category icons/images load                                   | No broken images                                                    |           |
| TP-007-3 | Clicking a category navigates or filters                     | Expected behaviour per design                                       |           |
| TP-007-4 | Mobile: grid collapses to 2 or 1 column                      | No horizontal scroll                                                |           |

### TP-008 About / Careers / Partner Pages

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-008-1 | `/about` — team section and mission statement render         | Content visible, images load                                        |           |
| TP-008-2 | `/careers` — job listings or "no open roles" message visible | Page not blank                                                      |           |
| TP-008-3 | `/partner` — contact/form section renders                    | Form or CTA visible                                                 |           |
| TP-008-4 | All three pages: mobile layout no overflow                   | Single-column on 375px                                              |           |

### TP-009 404 Not Found (`/*`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-009-1 | Navigate to `/nonexistent-route`                             | 404 page renders (not a blank screen)                               |           |
| TP-009-2 | "Go Home" or equivalent CTA present                          | Link navigates to `/`                                               |           |
| TP-009-3 | Navbar still rendered on 404                                 | Navigation accessible from error page                              |           |

---

## Section 2 — Navbar & Global Layout

### TP-010 Navbar (`/components/navbar.tsx`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-010-1 | Unauthenticated: public nav links visible                    | How It Works, Fixit 24/7 Plus, For Tradies, About                   |           |
| TP-010-2 | Homeowner: role-specific links visible                       | Dashboard, My Jobs, Find Tradies, Messages                          |           |
| TP-010-3 | Tradie: role-specific links visible                          | Dashboard, Browse Jobs, Messages, Credits                           |           |
| TP-010-4 | Admin: Admin link visible                                    | Admin link present alongside other links                            |           |
| TP-010-5 | Notification badge shows unread count                        | Red badge with count when notifications exist                       |           |
| TP-010-6 | Theme toggle switches light/dark                             | Mode persists across page navigation                                |           |
| TP-010-7 | Mobile (375px): hamburger menu visible                       | Three-line icon present, desktop links hidden                       |           |
| TP-010-8 | Mobile: hamburger opens full menu                            | All nav items accessible in mobile menu                             |           |
| TP-010-9 | Sign Out button works                                        | Clears session, redirects to `/login`                               |           |
| TP-010-10| Navbar hidden on `/login`, `/register`, `/signup`            | No navbar rendered on auth pages                                    |           |
| TP-010-11| Back/forward buttons work                                    | Browser history navigates correctly                                 |           |

---

## Section 3 — Homeowner Dashboard & Flows

### TP-011 Homeowner Dashboard (`/dashboard`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-011-1 | Summary stats/widgets render                                 | Active jobs, pending claims, notifications counts visible           |           |
| TP-011-2 | Recent jobs section renders                                  | Job cards with status badges visible                                |           |
| TP-011-3 | Quick-action "Post a Job" CTA works                          | Navigates to `/jobs/new`                                            |           |
| TP-011-4 | Mobile: widgets stack vertically                             | No horizontal overflow on 375px                                     |           |
| TP-011-5 | Dark mode: all cards/widgets invert correctly                | No invisible text on dark background                                |           |

### TP-012 Post Job (`/jobs/new`, `/post-job`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-012-1 | Multi-step form renders all steps                            | Category → Description → Location → Photos → Review                |           |
| TP-012-2 | Category dropdown populated from API                         | Service categories load                                             |           |
| TP-012-3 | AI description assist button works                           | Generates description text (if OPENAI_API_KEY set)                  |           |
| TP-012-4 | Photo upload (Cloudinary) renders upload widget              | Upload dropzone/button visible                                      |           |
| TP-012-5 | Suburb input autocomplete works                              | Typing suburb shows suggestions                                     |           |
| TP-012-6 | Urgency selector renders (normal/urgent/emergency)           | Three options selectable                                            |           |
| TP-012-7 | Submit creates job and redirects to job detail               | Job detail page loads with newly created job                        |           |
| TP-012-8 | Validation: submit with missing fields shows errors          | Inline error messages per field                                     |           |
| TP-012-9 | Mobile: form full-width, steps accessible                    | Wizard steps usable on 375px                                        |           |

### TP-013 Jobs List (`/jobs`, `/my-jobs`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-013-1 | Homeowner sees only their own jobs                           | No other users' jobs in list                                        |           |
| TP-013-2 | Tradie sees available (unclaimed) jobs                       | Jobs from other users visible for claiming                          |           |
| TP-013-3 | Status filter works (open/claimed/completed)                 | List updates on filter change                                       |           |
| TP-013-4 | Empty state renders when no jobs                             | "No jobs yet" message, not a blank/broken layout                    |           |
| TP-013-5 | Job card links navigate to `/jobs/:id`                       | Correct job detail loads                                            |           |
| TP-013-6 | Mobile: job cards stack as single column                     | Readable on 375px                                                   |           |

### TP-014 Job Detail (`/jobs/:id`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-014-1 | Job title, description, category, location render            | All metadata visible                                                |           |
| TP-014-2 | Job photos display in gallery                                | Cloudinary images load                                              |           |
| TP-014-3 | Tradie: "Claim Job" / bid button visible                     | CTA available for unclaimed jobs                                    |           |
| TP-014-4 | Claiming deducts $22 lead cost and shows confirmation        | Wallet balance updates, success message shown                       |           |
| TP-014-5 | Homeowner: claim list shows tradies who claimed              | Tradie cards/names visible under claims                             |           |
| TP-014-6 | Homeowner: "Accept Claim" button triggers conversation       | Conversation auto-created, redirect to message thread               |           |
| TP-014-7 | Job map renders location pin                                 | Map visible with marker at job suburb                               |           |
| TP-014-8 | Mobile: photos, map, claims stack correctly                  | No overflow on 375px                                                |           |
| TP-014-9 | Dark mode: map tiles and overlays visible                    | Map readable in dark mode                                           |           |

### TP-015 Find Tradies (`/tradies`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-015-1 | Tradie cards grid renders                                    | Avatar, name, trade, rating visible per card                        |           |
| TP-015-2 | Category filter narrows results                              | Only tradies matching category shown                                |           |
| TP-015-3 | Location/suburb filter works                                 | Tradies filtered by service area                                    |           |
| TP-015-4 | Rating sort orders correctly                                 | Highest rating first                                                |           |
| TP-015-5 | Empty state when no tradies match filter                     | "No tradies found" message                                          |           |
| TP-015-6 | Mobile: 1–2 column grid on 375px                            | No card overflow                                                    |           |

---

## Section 4 — Tradie Dashboard & Flows

### TP-016 Tradie Dashboard (`/dashboard/tradie`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-016-1 | Wallet balance widget shows current balance                  | Dollar amount displayed in cents-to-dollars conversion              |           |
| TP-016-2 | Welcome grant ($111 AUD) shown on first login                | Grant reflected in wallet balance                                   |           |
| TP-016-3 | Available jobs section renders                               | Unclaimed jobs matching tradie service area listed                  |           |
| TP-016-4 | Active claims section renders                                | Jobs tradie has claimed listed                                      |           |
| TP-016-5 | Earnings summary renders                                     | Completed job count and earnings visible                            |           |
| TP-016-6 | Mobile: widgets stack, no overflow                           | Readable on 375px                                                   |           |

### TP-017 Credits Page (`/credits`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-017-1 | Three credit packages render ($49/$99/$149 AUD)              | Package cards with prices visible                                   |           |
| TP-017-2 | Current balance displayed                                    | Wallet balance shown prominently                                    |           |
| TP-017-3 | Transaction history renders                                  | List of past credit purchases/usages                                |           |
| TP-017-4 | "Buy" triggers Stripe checkout                               | Redirect to Stripe or modal opens                                   |           |
| TP-017-5 | Non-tradie cannot access `/credits`                          | Redirects homeowner/admin away                                      |           |
| TP-017-6 | Mobile: package cards stack vertically                       | Readable on 375px                                                   |           |

---

## Section 5 — Admin Dashboard

### TP-018 Admin Dashboard (`/dashboard/admin`, `/admin`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-018-1 | User management table renders all users                      | Paginated table with name, email, role, status                      |           |
| TP-018-2 | Admin can suspend/activate users                             | Status updates reflected in table                                   |           |
| TP-018-3 | Job moderation table renders all jobs                        | Jobs with status filters accessible                                 |           |
| TP-018-4 | Admin can view any job detail                                | Job detail page accessible from admin view                          |           |
| TP-018-5 | Credit system panel renders                                  | Tradie wallet balances visible, grant controls present              |           |
| TP-018-6 | Non-admin cannot access `/admin`                             | Redirects homeowner/tradie to their dashboard                       |           |
| TP-018-7 | Mobile: tables scroll horizontally within container          | No page-level horizontal scroll                                     |           |

### TP-019 Tradie Profile Admin View (`/tradies/:id`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-019-1 | Admin can view any tradie's profile                          | Profile renders with trade, ABN, service area, reviews              |           |
| TP-019-2 | Non-admin accessing `/tradies/:id` is redirected             | Homeowner/tradie redirected to their dashboard                      |           |
| TP-019-3 | Profile avatar, rating, and contact details render           | All fields populated or show "not provided"                         |           |

---

## Section 6 — Messaging

### TP-020 Messages List (`/messages`, `/conversations`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-020-1 | Conversation cards render with counterpart name and preview  | Last message snippet and timestamp visible                          |           |
| TP-020-2 | Unread conversations highlighted                             | Visual distinction (bold/badge) for unread                          |           |
| TP-020-3 | Empty state when no conversations                            | "No messages yet" message, not blank                                |           |
| TP-020-4 | Click conversation navigates to `/messages/:id`              | Correct thread loads                                                |           |
| TP-020-5 | Mobile: conversation list full-width                         | Tap-friendly items on 375px                                         |           |

### TP-021 Message Thread (`/messages/:id`, `/conversations/:id`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-021-1 | Message history renders in chronological order               | Older messages at top, newest at bottom                             |           |
| TP-021-2 | Own messages right-aligned, counterpart left-aligned         | Visual distinction of sender                                        |           |
| TP-021-3 | Send message updates thread without page reload              | New message appears immediately                                     |           |
| TP-021-4 | 5-second poll refreshes new messages from counterpart        | New messages appear within 5s of being sent                         |           |
| TP-021-5 | Text input clears after send                                 | Input field empty after submission                                  |           |
| TP-021-6 | Job context card visible at top of thread                    | Related job title/link shown                                        |           |
| TP-021-7 | Mobile: input fixed at bottom, messages scrollable           | Chat UI usable on 375px                                             |           |

---

## Section 7 — Profile & Notifications

### TP-022 Profile Page (`/profile`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-022-1 | Avatar upload via Cloudinary works                           | Image uploads and preview updates                                   |           |
| TP-022-2 | Name, email, bio fields editable and saveable                | Changes persist after save                                          |           |
| TP-022-3 | Tradie-specific fields visible for tradie role               | Trade, ABN, service suburbs, radius, hourly rate fields shown       |           |
| TP-022-4 | Homeowner sees homeowner-specific fields only                | No tradie-specific fields visible                                   |           |
| TP-022-5 | Save shows success toast                                     | "Profile updated" confirmation                                      |           |
| TP-022-6 | Mobile: form full-width, labels above inputs                 | No label/input overlap on 375px                                     |           |

### TP-023 Notifications Page (`/notifications`)

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-023-1 | Notification items render with icon, title, and timestamp    | Structured list layout                                              |           |
| TP-023-2 | Unread notifications highlighted                             | Visual distinction for unread items                                 |           |
| TP-023-3 | Clicking notification marks as read                          | Highlight removed, badge count decrements in navbar                 |           |
| TP-023-4 | "Mark all as read" works                                     | All items marked read, badge cleared                                |           |
| TP-023-5 | Empty state when no notifications                            | "All caught up" or equivalent message                               |           |
| TP-023-6 | Mobile: items full-width, tap targets ≥ 44px                 | Accessible on 375px                                                 |           |

---

## Section 8 — Cross-Cutting Concerns

### TP-024 Responsive Design

| ID       | Test Case                                                    | Viewports                     | Pass/Fail |
|----------|--------------------------------------------------------------|-------------------------------|-----------|
| TP-024-1 | No horizontal scroll on any public page                      | 375px, 768px                  |           |
| TP-024-2 | No horizontal scroll on any authenticated page               | 375px, 768px                  |           |
| TP-024-3 | Tables/data grids scroll within their container              | 375px                         |           |
| TP-024-4 | All buttons/links meet 44×44px minimum tap target            | 375px                         |           |
| TP-024-5 | Grid layouts transition correctly between breakpoints        | 375 → 768 → 1280              |           |

### TP-025 Dark / Light Mode

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-025-1 | Toggle persists across page navigation                       | Chosen mode maintained in all pages                                 |           |
| TP-025-2 | All text readable in dark mode (contrast ≥ 4.5:1)           | No invisible/low-contrast text                                      |           |
| TP-025-3 | All icons visible in both modes                              | No icons disappear                                                  |           |
| TP-025-4 | Form inputs styled correctly in dark mode                    | Borders and placeholder text visible                                |           |
| TP-025-5 | Toasts/alerts readable in both modes                         | Error/success toasts visible in dark mode                           |           |

### TP-026 Role-Based Access Control

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-026-1 | Unauthenticated user → `/dashboard` → redirect to `/login`  | Login page loads with return URL param                              |           |
| TP-026-2 | Homeowner → `/dashboard/tradie` → redirect                   | Redirected to homeowner dashboard                                   |           |
| TP-026-3 | Tradie → `/dashboard/homeowner` → redirect                   | Redirected to tradie dashboard                                      |           |
| TP-026-4 | Homeowner → `/credits` → redirect                            | Redirected away from credits page                                   |           |
| TP-026-5 | Non-admin → `/admin` → redirect                              | Redirected to appropriate dashboard                                 |           |
| TP-026-6 | Non-admin → `/tradies/:id` → redirect                        | Redirected to appropriate dashboard                                 |           |

### TP-027 Accessibility

| ID       | Test Case                                                    | Expected Result                                                     | Pass/Fail |
|----------|--------------------------------------------------------------|---------------------------------------------------------------------|-----------|
| TP-027-1 | All images have `alt` attributes                             | No images missing alt text                                          |           |
| TP-027-2 | All form inputs have associated `<label>`                    | Screen reader can identify each field                               |           |
| TP-027-3 | Keyboard navigation: Tab through all interactive elements    | Focus ring visible, logical tab order                               |           |
| TP-027-4 | Modal dialogs trap focus                                     | Tab cycles within modal, not page behind                            |           |
| TP-027-5 | Error messages linked to inputs via `aria-describedby`       | Screen readers announce error on invalid input                      |           |
| TP-027-6 | Colour is not sole indicator of state                        | Status badges use text + colour                                     |           |

---

## Defect Severity Classification

| Severity | Definition                                                        |
|----------|-------------------------------------------------------------------|
| P0       | App crash, data loss, security bypass, broken auth flow          |
| P1       | Core user flow broken (cannot post job, claim, or message)       |
| P2       | Layout broken on a specific viewport or mode; WCAG AA failure    |
| P3       | Visual inconsistency, minor alignment, non-critical UX issue     |
| P4       | Cosmetic (colour mismatch, font weight)                          |

---

## Figma Assets

- **Navigation & Layout Audit Map:** https://www.figma.com/board/8PwHBU7VwiD0LN7xqlg1hT
- **Test Execution Schedule (Gantt):** https://www.figma.com/board/Hb0Qz7CmVUlMyl8rrW9Gjf
