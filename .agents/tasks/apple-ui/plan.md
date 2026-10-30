# Implementation Plan — Apple UI Redesign (PG Manager)

Scope: **Visual/styling + form UI/UX only.** Do NOT change routing, route structure, link
hrefs, financial business logic (`lib/services/*`), or any data model. Windows workspace —
use forward slashes in imports. Final gate: `npm run build` passes with 0 TypeScript errors.

The Apple design system this plan applies (authoritative tokens):
- Typography: `-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif`; body 14px,
  labels 13px, captions 12px, antialiased.
- Colors: bg `#F2F2F7` (iOS grouped bg); cards pure white `#FFFFFF`; primary `#007AFF`
  (iOS blue); green `#34C759` (paid/active status only); destructive `#FF3B30`; warning
  `#FF9500`; text primary `#1C1C1E`; text secondary `#8E8E93`; separator/border `#E5E5EA`;
  placeholder `#C7C7CC`.
- Elevation (cards): `shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]`.
- Radius: cards/panels `rounded-2xl` (16px); inputs `rounded-xl` (12px); buttons
  `rounded-xl`; small badges `rounded-full`; toggles `rounded-full`.
- Status badge tints (bg = color/10, text = color, border-transparent): Active/Paid/Vacant
  `#34C759`; Notice/Partial `#FF9500`; Overdue/Pending `#FF3B30`; Left/Inactive `#8E8E93`.
- Tables: no outer border; header `text-xs uppercase text-[#8E8E93]`; row hover `bg-[#F2F2F7]/50`.

Ordering rationale: shared foundation (ToggleSwitch + globals.css + primitives) must land
first because every page consumes those tokens. Then chrome/navigation, then auth+dashboard,
then the CRUD feature pages, then the AddResidentForm card UX. Each file is touched by exactly
one step (no double-editing). Each step leaves the project building.

---

## Toggle locations found (all must become `<ToggleSwitch />`)

| File | Field | Approx line | New color |
|------|-------|-------------|-----------|
| `components/residents/AddResidentForm.tsx` | wantsFood | ~495 | `orange` |
| `components/residents/AddResidentForm.tsx` | depositReceived | ~642 | `green` |
| `components/residents/AddResidentForm.tsx` | recordFirstPayment | ~727 | `green` |
| `components/settings/SettingsForm.tsx` | prorateFirstMonth | ~216 | `green` |
| `components/plans/PlansClient.tsx` | isActive | ~430 | `blue` |
| `components/rooms/RoomsClient.tsx` | hasSubMeter | ~320 | `blue` |
| `components/rooms/RoomsClient.tsx` | isActive | ~340 | `blue` |

Each replacement swaps the `<button>`+`<span>` knob block for
`<ToggleSwitch checked={value} onChange={(v)=>setValue(field,v)} color="…" size="md" />`.
Toggles are folded into each file's own styling pass (no separate pass that re-edits a file).

## Emoji / icon findings

No literal emoji characters exist anywhere in `app/` or `components/`. The whole UI already
uses `lucide-react`. The only non-lucide UI icon is the inline SVG home logo in
`app/(auth)/login/page.tsx` — replace it with `Building2` from lucide-react. Meal indicator
icons (`Coffee`/`Sun`/`Moon`/`Utensils`) in `PlansClient.tsx` and `AddResidentForm.tsx` are
already lucide line icons — keep them, just recolor to Apple tints.

---

## Step 1 — Apple design foundation (shared primitives)

Create and update the shared building blocks every page depends on.

- [ ] 1a. Create `components/ui/toggle-switch.tsx` — a `'use client'` component:
  `ToggleSwitch({ checked, onChange, disabled?, size='md', color='blue' })`, `cn` from
  `@/lib/utils`. iOS pill: `<button type="button" role="switch" aria-checked={checked}>`
  track `rounded-full transition-all duration-200 ease-in-out`, off bg `#E5E5EA`, on bg =
  blue(`#007AFF`)/green(`#34C759`)/orange(`#FF9500`) per `color`. White knob
  `bg-white rounded-full shadow-sm`, `transition-all duration-200`. md: track `w-[51px]
  h-[31px]`, knob `w-[27px] h-[27px]`, `translate-x-[2px]` off / `translate-x-[22px]` on. sm:
  track `w-[38px] h-[22px]`, knob `w-[18px] h-[18px]`, `translate-x-[2px]` off /
  `translate-x-[18px]` on. `disabled:opacity-50 disabled:cursor-not-allowed`.
  Files: `components/ui/toggle-switch.tsx`
  Verify: `npm run build` compiles (new file has no type errors).

- [ ] 1b. Rewrite `app/globals.css` `:root` to the Apple palette exactly:
  `--background 240 5% 96%` (pair `#F2F2F7`), `--foreground 0 0% 11%` (`#1C1C1E`),
  `--card 0 0% 100%`, `--card-foreground 0 0% 11%`, `--popover 0 0% 100%`,
  `--popover-foreground 0 0% 11%`, `--primary 211 100% 50%` (`#007AFF`),
  `--primary-foreground 0 0% 100%`, `--secondary 240 5% 96%`, `--secondary-foreground 0 0% 11%`,
  `--muted 240 5% 94%`, `--muted-foreground 240 4% 54%` (`#8E8E93`), `--accent 240 5% 94%`,
  `--accent-foreground 0 0% 11%`, `--destructive 4 90% 58%` (`#FF3B30`),
  `--destructive-foreground 0 0% 100%`, `--border 240 6% 90%` (`#E5E5EA`),
  `--input 240 6% 90%`, `--ring 211 100% 50%`, `--radius 0.75rem`. Remove the `.dark` block
  (dark mode out of scope). Add to the `@layer base { body {} }`: `font-family:
  -apple-system, BlinkMacSystemFont, var(--font-inter), 'Segoe UI', sans-serif;`
  `-webkit-font-smoothing: antialiased; font-size: 14px;`. Add `::-webkit-scrollbar`
  (`&::-webkit-scrollbar { width: 6px; height: 6px }`, track `transparent`, thumb `#C7C7CC`
  `rounded-full`, `&:hover` thumb `#8E8E93`).
  Files: `app/globals.css`
  Verify: `npm run build` compiles.

- [ ] 1c. Update `app/layout.tsx` so the Apple font stack leads: change `const inter =
  Inter(...)` usage from `<body className={inter.className}>` to `<body
  className={inter.variable}>` (this defines `--font-inter` instead of forcing the font), so
  the globals.css stack with `-apple-system` first actually applies. Keep the `Inter` import.
  Files: `app/layout.tsx`
  Verify: `npm run build` compiles; login/dashboard render with the system font leading.

- [ ] 1d. Restyle `components/ui/button.tsx` `buttonVariants`: base → `rounded-xl font-medium
  transition-all duration-150 active:scale-[0.97]` (replace `rounded-md`/`transition-colors`);
  keep focus rings. `default`: `bg-[#007AFF] text-white hover:bg-[#0071EB]`;
  `destructive`: `bg-[#FF3B30] text-white hover:bg-[#E0352B]`; `outline`:
  `border border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]`; `secondary`:
  `bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]`; `ghost`:
  `text-[#007AFF] hover:bg-[#F2F2F7]`; `link`: `text-[#007AFF]`. Sizes: `default h-[44px] px-5`,
  `sm h-9 px-4`, `lg h-[50px] px-7`, keep `icon h-10 w-10`.
  Files: `components/ui/button.tsx`
  Verify: `npm run build` compiles.

- [ ] 1e. Restyle `components/ui/input.tsx`: `rounded-xl h-11 border-[#E5E5EA] bg-white
  text-[#1C1C1E] placeholder:text-[#C7C7CC] focus-visible:ring-2
  focus-visible:ring-[#007AFF] focus-visible:ring-offset-0 focus-visible:border-[#007AFF]`
  (replace `rounded-md h-10 border-input` + `ring-offset-2`).
  Files: `components/ui/input.tsx`
  Verify: `npm run build` compiles.

- [ ] 1f. Restyle `components/ui/card.tsx` `Card` base: `rounded-2xl border border-[#E5E5EA]
  bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]` (replace
  `rounded-lg border bg-card shadow-sm`). Leave `CardTitle`/`CardHeader`/etc. (pages override).
  Files: `components/ui/card.tsx`
  Verify: `npm run build` compiles.

- [ ] 1g. Restyle `components/ui/badge.tsx`: base `rounded-full text-xs font-medium px-2.5
  py-0.5 border` (change `font-semibold`→`font-medium`); `default`:
  `bg-[#007AFF] text-white border-transparent`; `secondary`:
  `bg-[#F2F2F7] text-[#1C1C1E] border-transparent`; `destructive`:
  `bg-[#FF3B30]/10 text-[#FF3B30] border-transparent`; `outline`:
  `border border-current bg-transparent text-foreground`.
  Files: `components/ui/badge.tsx`
  Verify: `npm run build` compiles.

- [ ] 1h. Restyle `components/ui/tabs.tsx`: `TabsList` →
  `inline-flex items-center justify-center rounded-xl bg-[#F2F2F7] p-1 gap-1
  text-muted-foreground` (remove `h-10`); `TabsTrigger` → `rounded-lg text-[#8E8E93]
  font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-[#1C1C1E]
  data-[state=active]:shadow-sm transition-all` (replace `rounded-sm` + bg-background/text-foreground).
  Files: `components/ui/tabs.tsx`
  Verify: `npm run build` compiles.

- [ ] 1i. Restyle `components/ui/select.tsx`: `SelectTrigger` → `rounded-xl h-11
  border-[#E5E5EA] bg-white focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]`
  (replace `rounded-md h-10 border-input` + `ring-offset-2`); `SelectContent` → `rounded-xl
  border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)]` (replace `rounded-md ... shadow-md`);
  `SelectItem` → `rounded-lg focus:bg-[#F2F2F7] focus:text-[#1C1C1E]` (replace `rounded-sm`).
  Files: `components/ui/select.tsx`
  Verify: `npm run build` compiles.

- [ ] 1j. Restyle `components/ui/table.tsx` defaults: `TableRow` `hover:bg-[#F2F2F7]/50`
  (replace `hover:bg-muted/50`); `TableHead` → `h-11 px-4 text-xs uppercase tracking-wide
  font-medium text-[#8E8E93]` (replace `h-12 ... text-muted-foreground`).
  Files: `components/ui/table.tsx`
  Verify: `npm run build` compiles.

- [ ] 1k. Restyle `components/ui/dialog.tsx`: `DialogOverlay` `bg-black/30` (replace
  `bg-black/80`); `DialogContent` base `rounded-2xl border-[#E5E5EA]
  shadow-[0_8px_30px_rgba(0,0,0,0.12)]` (replace `border bg-background ... shadow-lg ...
  sm:rounded-lg`).
  Files: `components/ui/dialog.tsx`
  Verify: `npm run build` compiles.

## Step 2 — Layout chrome (navigation)

- [ ] 2a. `components/layout/Sidebar.tsx` (macOS sidebar): aside `bg-white border-r
  border-[#E5E5EA]`; logo tile `bg-[#007AFF] rounded-lg` with white `DoorOpen`, title
  `text-[#1C1C1E]`; nav items default `text-[#1C1C1E] text-sm` with icon `text-[#8E8E93]`,
  active `bg-[#007AFF] text-white rounded-xl` (text AND icon white), hover `bg-[#F2F2F7]`;
  bottom area separator `border-[#E5E5EA]`, name `text-[#1C1C1E] font-semibold`, email
  `text-[#8E8E93]`; Sign out `hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]`. Optionally add
  small uppercase `text-[#8E8E93]` section labels grouping items (Management / Finance /
  System) — keep all `href`s unchanged.
  Files: `components/layout/Sidebar.tsx`
  Verify: `npm run build` compiles; sidebar active pill is blue, not green.

- [ ] 2b. `components/layout/TopBar.tsx`: header `h-[52px] bg-white border-b border-[#E5E5EA]`;
  add a center search pill `<input className="rounded-full bg-[#F2F2F7] border-none ...">`
  with a `Search` lucide icon inside (visual only, local state, no submit wiring); right
  `Bell` button `hover:bg-[#F2F2F7] rounded-xl`; pgName title `text-[#1C1C1E]`.
  Files: `components/layout/TopBar.tsx`
  Verify: `npm run build` compiles.

- [ ] 2c. `components/layout/BottomNav.tsx`: active `text-[#007AFF]` (icon + label), inactive
  `text-[#8E8E93]`; `border-t border-[#E5E5EA]`. Keep hrefs.
  Files: `components/layout/BottomNav.tsx`
  Verify: `npm run build` compiles.

- [ ] 2d. `app/(dashboard)/layout.tsx`: root div `bg-[#F2F2F7]` (replace `bg-[#f5f5f5]`).
  Files: `app/(dashboard)/layout.tsx`
  Verify: `npm run build` compiles; dashboard bg is `#F2F2F7`.

## Step 3 — Login

- [ ] 3a. `app/(auth)/login/page.tsx`: outer `bg-[#F2F2F7]` (replace the green gradient); logo
  tile `bg-[#34C759] rounded-2xl` with lucide `Building2` (white) — remove the inline SVG;
  title `PG Manager` `text-[22px] font-semibold text-[#1C1C1E]`; subtitle `text-sm
  text-[#8E8E93]`. Import `Building2` from `lucide-react`.
  Files: `app/(auth)/login/page.tsx`
  Verify: `npm run build` compiles.

- [ ] 3b. `components/auth/LoginForm.tsx`: Card `rounded-2xl p-8
  shadow-[0_20px_60px_rgba(0,0,0,0.08)] border-0`; card title `text-[22px] font-semibold
  text-[#1C1C1E]`, subtitle `text-sm text-[#8E8E93]`; labels `text-sm font-medium
  text-[#1C1C1E]`; remove per-input `rounded-lg` overrides (Input primitive is now Apple); error
  box `bg-[#FF3B30]/10 text-[#FF3B30]` (no border); inline field errors `text-[#FF3B30]`;
  login button `w-full bg-[#007AFF] h-[44px] rounded-xl` (use default variant + `w-full
  h-[44px]`), keep the `Loader2` spinner.
  Files: `components/auth/LoginForm.tsx`
  Verify: `npm run build` compiles.

## Step 4 — Dashboard

- [ ] 4a. `app/(dashboard)/dashboard/page.tsx`: heading `text-[22px] font-semibold
  text-[#1C1C1E]`, subtitle `text-[#8E8E93]`; stat `Card`s use the new Apple card defaults
  (drop `border-0 shadow-sm rounded-xl` overrides → keep just `<Card>`); stat icon tiles to
  Apple tints — Residents `bg-[#007AFF]/10 text-[#007AFF]`, Occupied Beds
  `bg-[#34C759]/10 text-[#34C759]`, Pending Rent `bg-[#FF9500]/10 text-[#FF9500]`, Income
  `bg-[#AF52DE]/10 text-[#AF52DE]`; section `CardTitle` `text-[15px] font-semibold
  text-[#1C1C1E]`; "Phase 2 coming soon" text `text-[#8E8E93]`. Keep lucide icons.
  Files: `app/(dashboard)/dashboard/page.tsx`
  Verify: `npm run build` compiles.

## Step 5 — Rooms page

- [ ] 5a. `components/rooms/RoomsClient.tsx`: header `text-[22px] font-semibold
  text-[#1C1C1E]`, subtitle `text-[#8E8E93]`; Add Room button = default Apple variant (drop
  `bg-green-600`); filter pills active `bg-[#007AFF]/10 text-[#007AFF]`, inactive `bg-white
  text-[#8E8E93] border border-[#E5E5EA]`, all `rounded-xl`; empty-state tile `bg-[#F2F2F7]
  text-[#8E8E93]`; remove dialog `rounded-lg` overrides on inputs/selects/buttons (primitives
  are Apple now); replace the **hasSubMeter** toggle (~L320) with `<ToggleSwitch
  color="blue">` and the **isActive** toggle (~L340) with `<ToggleSwitch color="blue">`
  (read both `watch` values, `setValue` on change).
  Files: `components/rooms/RoomsClient.tsx`
  Verify: `npm run build` compiles; both toggles render as iOS switches.

- [ ] 5b. `components/rooms/RoomCard.tsx`: card `rounded-2xl border border-[#E5E5EA]` + Apple
  shadow; room number `text-[#1C1C1E]`; Inactive badge `bg-[#8E8E93]/10 text-[#8E8E93]`;
  sharing badge double `bg-[#007AFF]/10 text-[#007AFF]`, triple `bg-[#5856D6]/10
  text-[#5856D6]`; Sub-meter badge `bg-[#FF9500]/10 text-[#FF9500]`; bed dots vacant
  `bg-[#34C759]`, occupied `bg-[#FF3B30]`; footer count `text-[#8E8E93]`; Deactivate button
  `text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/10`, Activate `text-[#34C759]`.
  Files: `components/rooms/RoomCard.tsx`
  Verify: `npm run build` compiles.

## Step 6 — Plans page

- [ ] 6a. `components/plans/PlansClient.tsx`: header `text-[22px] font-semibold
  text-[#1C1C1E]`, subtitle `text-[#8E8E93]`; Add Plan button = Apple default; table
  container `bg-white rounded-2xl` + Apple shadow, no outer border; header row — remove
  `bg-gray-50`, header cells `text-xs uppercase tracking-wide text-[#8E8E93] font-medium`;
  row hover `bg-[#F2F2F7]/50`; Type badge `bg-[#007AFF]/10 text-[#007AFF]`; meal badges —
  Breakfast `bg-[#FF9500]/10 text-[#FF9500]` (`Coffee`), Lunch `bg-[#34C759]/10 text-[#34C759]`
  (`Sun`), Dinner `bg-[#5856D6]/10 text-[#5856D6]` (`Moon`), keep icons; price `text-[#1C1C1E]`;
  status Active `bg-[#34C759]/10 text-[#34C759]`, Inactive `bg-[#8E8E93]/10 text-[#8E8E93]`;
  mobile cards `rounded-2xl border border-[#E5E5EA]` + Apple shadow; dialog inputs/selects/
  buttons Apple (drop `rounded-lg`); meal checkboxes keep but `accent-[#007AFF]`; replace
  the **isActive** toggle (~L430) with `<ToggleSwitch color="blue">`.
  Files: `components/plans/PlansClient.tsx`
  Verify: `npm run build` compiles; isActive toggle is an iOS switch.

## Step 7 — Residents list & profile

- [ ] 7a. `components/residents/ResidentsList.tsx`: header `text-[22px] font-semibold
  text-[#1C1C1E]`; count badge `bg-[#007AFF]/10 text-[#007AFF]`; Add Resident button Apple;
  filter selects Apple (drop `rounded-lg`); `STATUS_BADGE` → active
  `text-[#34C759] border-transparent bg-[#34C759]/10`, notice
  `text-[#FF9500] border-transparent bg-[#FF9500]/10`, left
  `text-[#8E8E93] border-transparent bg-[#8E8E93]/10`; avatar circle
  `bg-[#007AFF]/10 text-[#007AFF]`; table container `bg-white rounded-2xl` + Apple shadow, no
  outer border, header row no bg + `text-xs uppercase text-[#8E8E93]`, row hover
  `bg-[#F2F2F7]/50`; mobile cards `rounded-2xl border border-[#E5E5EA]` + Apple shadow;
  empty-state tile `bg-[#F2F2F7] text-[#8E8E93]`.
  Files: `components/residents/ResidentsList.tsx`
  Verify: `npm run build` compiles.

- [ ] 7b. `components/residents/ResidentProfile.tsx`: back link `text-[#8E8E93]
  hover:text-[#1C1C1E]`; header card `rounded-2xl` + Apple shadow `border-[#E5E5EA]`; avatar
  tile `bg-[#007AFF]/10 text-[#007AFF]`; name `text-[22px] font-semibold text-[#1C1C1E]`;
  status badge Apple tints; meta icons `text-[#8E8E93]`; Give Notice button
  `text-[#FF9500] border-[#FF9500]/30 hover:bg-[#FF9500]/10`, Check Out
  `text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/10`; notice banner
  `bg-[#FF9500]/10 border-[#FF9500]/20 text-[#FF9500]`; `TabsList` → remove `bg-white border
  border-gray-100`, use `bg-[#F2F2F7] rounded-xl p-1 gap-1 flex-wrap h-auto`, triggers
  `rounded-lg`; overview cards `rounded-2xl` + Apple shadow, section titles `text-[15px]
  font-semibold text-[#1C1C1E]`, labels `text-[#8E8E93]`, values `text-[#1C1C1E]`, notes box
  `bg-[#F2F2F7]`; plan-history table Apple header, "Current" badge
  `bg-[#34C759]/10 text-[#34C759]`; placeholder tab icon tiles Apple tints (rent
  `bg-[#FF9500]/10 text-[#FF9500]`, payments `bg-[#007AFF]/10 text-[#007AFF]`, electricity
  `bg-[#FF9500]/10 text-[#FF9500]`, deposit `bg-[#5856D6]/10 text-[#5856D6]`); dialogs Apple
  (inputs/selects/buttons); Record Notice button `bg-[#FF9500] hover:bg-[#E68B00] text-white`,
  notice banner `bg-[#FF9500]/10 text-[#FF9500]`; success/error banners Apple tints.
  Files: `components/residents/ResidentProfile.tsx`
  Verify: `npm run build` compiles.

## Step 8 — Settings page

- [ ] 8a. `components/settings/SettingsForm.tsx` (Apple Settings app style): `TabsList`
  Apple pill tabs (`bg-[#F2F2F7] rounded-xl`); each group `Card` uses new Apple defaults,
  `CardTitle` `text-[15px] font-semibold text-[#1C1C1E]`; inputs Apple (drop `rounded-lg`); the
  receipt `<textarea>` → `rounded-xl border-[#E5E5EA] focus:ring-2 focus:ring-[#007AFF]`; billing
  radios keep but `accent-[#007AFF]`; **prorateFirstMonth** row → label LEFT, `<ToggleSwitch
  color="green">` RIGHT (iOS Settings row) — restructure to `flex items-center justify-between`
  and remove the old `<button>`+`<span>` block (~L216); Save/Change-Password buttons = Apple
  default variant (drop `bg-green-500`); success banner `bg-[#34C759]/10 text-[#34C759]`, error
  banner `bg-[#FF3B30]/10 text-[#FF3B30]`. (Security tab sits outside the main `<form>` — keep
  that structure; just restyle.)
  Files: `components/settings/SettingsForm.tsx`
  Verify: `npm run build` compiles; prorate toggle is an iOS switch on the right.

## Step 9 — AddResidentForm card UX + sharing-based plan filter + food-optional nested options

- [ ] 9a. `components/residents/AddResidentForm.tsx` — redesign the "Stay & Plan" step into a
  proper card-based UX. Add a TOP-LEVEL **Sharing Type** selector (two Apple selectable cards:
  Double / Triple), new state `selectedSharing` (UI-only, NOT submitted, NOT in the schema).
  When sharing changes: clear room/bed/plan/food (`setValue('room','')`,
  `setValue('bed','')`, `setValue('currentPlan','')`, `setSelectedFoodPlanId('')`,
  `setWantsFood(false)`). Filter the Room dropdown to rooms whose `sharingType` matches
  `selectedSharing`. Keep the existing vacant-bed load effect. Filter room plans by
  `selectedSharing` (the existing `roomPlans` filter currently keys off the selected room's
  sharing — keep that working AND gate it on `selectedSharing` so plans match the top selector).
  Do NOT change `residentSchema`, `checkInResident`, or what is submitted (food plan still
  appended to `notes` on submit exactly as today). Files: `components/residents/AddResidentForm.tsx`
  Verify: `npm run build` compiles; selecting Double hides Triple plans and vice-versa.

- [ ] 9b. Same file — Apple-style the Room Plan cards (mandatory) and Food Plan cards
  (optional). Room plan selected state → `border-[#007AFF] bg-[#007AFF]/5`, selected tile
  `bg-[#007AFF] text-white` (replace green); food plan selected state → `border-[#FF9500]
  bg-[#FF9500]/10`, tile `bg-[#FF9500] text-white` (replace orange-400). Keep "Room Plan
  Mandatory" + "Food Plan Optional" badges and the meal-icon logic. The **Food Plan** section
  keeps the optional toggle that reveals nested food plan cards (food_only plans) — this is the
  "food optional → nested options" requirement, already present; just restyle. Replace the
  **wantsFood** toggle (~L495) with `<ToggleSwitch color="orange">`, **depositReceived**
  (~L642) with `<ToggleSwitch color="green">`, **recordFirstPayment** (~L727) with
  `<ToggleSwitch color="green">`. Files: `components/residents/AddResidentForm.tsx`
  Verify: `npm run build` compiles; all three toggles are iOS switches.

- [ ] 9c. Same file — finish Apple styling of the rest: stepper circles active/complete
  `bg-[#007AFF] text-white` ring `ring-[#007AFF]/20` (replace green); step header icon
  `text-[#007AFF]`; the main `Card` uses new Apple defaults; section cards
  `rounded-xl border-[#E5E5EA]`; deposit/first-rent nested panels `border-l-2
  border-[#34C759]/30`; price summary `bg-[#F2F2F7]`, total `text-[#1C1C1E]`; error banner
  `bg-[#FF3B30]/10 text-[#FF3B30]`; ID-upload info banner `bg-[#007AFF]/10 text-[#007AFF]
  border-[#007AFF]/20`; nav buttons — Back/Cancel `outline`, Next/Submit default Apple
  (drop `bg-green-600`); all inputs/selects Apple (drop per-field `rounded-xl h-10`
  overrides — rely on primitives, keep `h-10` only where layout needs it).
  Files: `components/residents/AddResidentForm.tsx`
  Verify: `npm run build` compiles.

## Step 10 — Cross-page consistency pass (convergence)

- [ ] 10a. Run `npm run build`. Fix every TypeScript/compile error. Open each route
  (`/login`, `/dashboard`, `/residents`, `/residents/new`, `/residents/[id]`, `/rooms`,
  `/plans`, `/settings`, and the placeholder pages) and confirm: no green accent remains in
  nav/buttons (blue `#007AFF` only), all toggles are iOS switches, status badges use the
  Apple tint system, tables have no outer border, no leftover `rounded-lg` input overrides.
  Re-run `npm run build` until it passes with 0 errors.
  Files: any file with a leftover issue.
  Verify: `npm run build` passes with 0 TypeScript errors; visual check of the routes above.

---

## Verification (final gate)

`npm run build` must pass with **0 TypeScript errors**. There is no test runner configured
(no vitest/jest), so the build is the verification command. If a build error appears, fix it
in the offending file and rebuild. Do not disable strict mode or skip the build.

Record what changed: a short list of files touched per step (already enumerated above) and
any assumption made (e.g. font stack uses `var(--font-inter)` so `-apple-system` leads; toggles
use semantic colors blue/green/orange; sharing selector in AddResidentForm is UI-only state).
