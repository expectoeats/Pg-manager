# Remaining Apple UI Redesign — Line-Accurate Execution Plan

Baseline commit (HEAD when this plan was written): `b3d95eff668eeff42e9bee77f402e281e75daad0`
(stored in `.agents/tasks/apple-ui/baseline.txt`)

This plan supersedes the old `features/FEAT-003.json` and `features/FEAT-004.json`. The brief above
**redefines** the groupings and adds a logo requirement. Follow THIS plan, not the old feature files.

## Scope & constraints (from the brief)

- ONLY visual/styling changes + the AddResidentForm sharing-selector UI. Do NOT touch business logic,
  `lib/services/*`, `lib/validators/*`, models, or routing. Do NOT change any `href`.
- The `(dashboard)` route group means URLs are `/residents` not `/dashboard/residents` — do not change hrefs.
- Windows workspace — forward slashes in imports.
- Money stays integer rupees; dates UTC/IST — unchanged (no logic touched).
- `/public/logo.png` EXISTS (42 KB) — use it via `next/image`.
- `ToggleSwitch` exists at `components/ui/toggle-switch.tsx`. API (confirmed by reading the file):
  `{ checked: boolean, onChange: (value: boolean) => void, disabled?: boolean, size?: 'sm'|'md', color?: 'blue'|'green'|'orange' }`.
  Default `size='md'`, `color='blue'`. It uses `checked`/`onChange` — NOT `value`/`onValueChange`.

## Current-state findings (READ THIS FIRST — avoids redoing finished work)

FEAT-001 and FEAT-002 are DONE: `app/globals.css` Apple palette, all `components/ui/*` primitives are
Apple (Button/Input/Card/Badge/Tabs/Select/Table/Dialog), `toggle-switch.tsx` exists, `app/layout.tsx`
font, Sidebar/TopBar/BottomNav/dashboard layout, login, dashboard.

Two target files are **already largely/fully Apple-styled** — do NOT redo them, only apply the noted
remaining deltas:

- `components/plans/PlansClient.tsx` — heading, Add Plan button, table container, header, row hover,
  type/meal/active badges, mobile cards, dialog form `isActive` ToggleSwitch, dialog inputs, meal
  checkboxes (`accent-[#007AFF]`) are ALL already done. **Only the list `isActive` control remains**
  (see §6 below).
- `components/settings/SettingsForm.tsx` — **FULLY done**: TabsList (primitive), Cards, CardTitles,
  inputs, textarea, billing radios (`accent-[#007AFF]`), prorate row **already uses `<ToggleSwitch>`**,
  Save/Change-Password buttons default variant, success/error banners Apple tints, ToggleSwitch
  imported. See §10 — only two optional cosmetic tweaks, otherwise leave it.

The remaining real work is the **logo** (3 files), **RoomsClient + RoomCard + ResidentsList +
ResidentProfile** (not done), **PlansClient list toggle** (small), and **AddResidentForm** (sharing
selector + 3 toggles + restyle).

## How line numbers are stated

Line numbers below come from `grep_search` (ripgrep). Its context display can drift ±1 line, so each
toggle block is also identified by a **content signature** (the `onClick` + the track class). The
implementer MUST read the file before editing and match by content. Line numbers are a guide, not a
substitute for reading.

---

## Step 0 — Logo (3 files)  → maps to workflow step `code-logo`

### 0.1 `components/layout/Sidebar.tsx`
Current logo tile (the `#007AFF` square + `DoorOpen`):
```
          <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
            <DoorOpen className="w-4 h-4 text-white" />
          </div>
```
(replace this 3-line tile)
- Replace it with exactly:
  `<Image src='/logo.png' width={32} height={32} alt='PG Manager' className='rounded-lg object-contain' />`
- Imports to add: `import Image from 'next/image';` (at top with the other imports).
- KEEP the `DoorOpen` import — it is still used by the Rooms nav item in `navItems`.
- Drift: none. Everything else stays the same.

### 0.2 `app/(auth)/login/page.tsx`
Current green `Building2` tile (lines ~9–11):
```
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#34C759] rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
```
- Replace it with exactly:
  `<Image src='/logo.png' width={56} height={56} alt='PG Manager' className='rounded-2xl object-contain' />`
- Imports: REMOVE `import { Building2 } from 'lucide-react';` (line 1, no longer used); ADD
  `import Image from 'next/image';`.
- Drift: none. Keep the surrounding card (`LoginForm`) unchanged.

### 0.3 `components/layout/TopBar.tsx`
Current pgName block (lines ~14–18):
```
      <div className="flex-1">
        <h2 className="font-semibold text-[#1C1C1E] text-sm lg:text-base">
          {pgName || 'PG Manager'}
        </h2>
      </div>
```
- Replace with a flex row that shows the logo on mobile next to the title:
```
      <div className="flex-1 flex items-center">
        <Image src='/logo.png' width={28} height={28} alt='' className='rounded-lg object-contain md:hidden mr-2' />
        <h2 className="font-semibold text-[#1C1C1E] text-sm lg:text-base">
          {pgName || 'PG Manager'}
        </h2>
      </div>
```
- Imports to add: `import Image from 'next/image';`
- Drift: none. (`alt=''` per brief — decorative on mobile.)

---

## Step 1 — FEAT-003: Rooms / Plans / Residents pages  → maps to workflow step `code-feat-003`

### 1.1 `components/rooms/RoomsClient.tsx`  (NOT done — green/gray throughout, hand-rolled toggles)
`ToggleSwitch` is ALREADY imported (line ~31). `cn` is imported. So only edits below are needed.

- Page heading (line ~163): `text-2xl font-bold text-gray-900` → `text-[22px] font-semibold text-[#1C1C1E]`
- Subtitle (line ~164): `text-gray-500 mt-1` → `text-[#8E8E93] mt-1`
- "Add Room" button (line ~165, AND the one in the empty-state ~line 169):
  remove `className="bg-green-600 hover:bg-green-700 text-white rounded-xl"` → default Apple variant
  (keep `<Plus .../> Add Room`; drop the green className).
- Filter pills (lines ~176–205): there are two pill groups (All/Vacant, and the all/double/triple
  sharing pills). For BOTH groups:
  - active: `bg-green-100 text-green-700` (and `bg-blue-100 text-blue-700` for sharing pills) →
    `bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20`
  - inactive: `bg-white text-gray-600 border border-gray-200` → `bg-white text-[#8E8E93] border border-[#E5E5EA]`
  - all `rounded-lg` → `rounded-xl`
- Empty state (lines ~159–171): tile `bg-gray-100` → `bg-[#F2F2F7]`; `DoorOpen` icon `text-gray-400` →
  `text-[#8E8E93]`; heading `text-gray-900` → `text-[#1C1C1E]`; subtitle `text-gray-500` → `text-[#8E8E93]`;
  empty-state "Add Room" button: remove bg-green-600.
- Dialog (lines ~213+):
  - `DialogContent` has `className="sm:max-w-md rounded-xl"` → `className="sm:max-w-md"` (remove `rounded-xl`; primitive is rounded-2xl).
  - Error box (line ~232): `bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg` →
    `bg-[#FF3B30]/10 text-[#FF3B30] px-3 py-2 rounded-lg` [inferred — brief lists error styling for other files; consistent Apple tint]
  - Every Input/SelectTrigger in the dialog with `className="rounded-lg"` (Room Number, Sharing Type
    SelectTrigger, Total Beds, Floor): remove the `rounded-lg` override (rely on primitives).
  - Bed-count-cannot-change note (line ~264) `bg-amber-50 border border-amber-200 ... text-amber-700` →
    `bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500]` [inferred for consistency — not in brief]
  - TOGGLE — hasSubMeter (block ~lines 319–333; signature: `onClick={() => setValue('hasSubMeter',
    !hasSubMeter)}` + track `'w-11 h-6 rounded-full transition-colors relative'` + knob `translate-x-5`):
    replace the entire `<button>...</button>` with
    `<ToggleSwitch checked={hasSubMeter} onChange={(v) => setValue('hasSubMeter', v)} color="blue" />`
    Keep the surrounding `<div className="flex items-center justify-between">` and `<Label>Has Sub-Meter</Label>`.
  - TOGGLE — isActive (block ~lines 339–352, only renders when `selectedRoom`; signature:
    `onClick={() => setValue('isActive', !isActive)}` + `w-11 h-6 rounded-full`): replace the entire
    `<button>...</button>` with `<ToggleSwitch checked={isActive} onChange={(v) => setValue('isActive', v)} color="blue" />`
    Keep the surrounding `<div className="flex items-center justify-between">` and `<Label>Active</Label>`.
  - Cancel button (line ~357): `className="flex-1 rounded-lg"` → `className="flex-1"` (remove rounded-lg)
  - Submit button (line ~365): `className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"` →
    `className="flex-1"` (default variant; remove bg-green-600 + rounded-lg)
- Drift: brief said "remove rounded-lg overrides" — matches. The amber note + error box conversions are
  inferred (consistent with theme); not strictly required by the brief.

### 1.2 `components/rooms/RoomCard.tsx`  (NOT done — gray/colored badges)
- Card root (line ~38): `bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col gap-3`
  → `bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] p-4 border border-[#E5E5EA] flex flex-col gap-3`
  (Drift: brief says "remove rounded-xl override (Card primitive is now rounded-2xl)" assuming a `<Card>`
  primitive, but this is a plain `<div>`. Apply `rounded-2xl` + Apple shadow + `border-[#E5E5EA]` to the div.)
- Room number (line ~50): `text-xl font-bold text-gray-900` → `text-xl font-bold text-[#1C1C1E]`
  (brief: "Room number text-[#1C1C1E] font-bold"; keep `text-xl`)
- Inactive badge (line ~52): `text-gray-400 border-gray-300` → `bg-[#8E8E93]/10 text-[#8E8E93] border-transparent`
- Sharing badge (line ~59): double `text-blue-600 border-blue-200 bg-blue-50` →
  `bg-[#007AFF]/10 text-[#007AFF] border-transparent`; triple `text-purple-600 border-purple-200 bg-purple-50` →
  `bg-[#5856D6]/10 text-[#5856D6] border-transparent`
- Floor label (line ~69): `text-gray-500` → `text-[#8E8E93]` [inferred for consistency]
- Sub-meter badge (line ~72): `text-orange-600 border-orange-200 bg-orange-50` →
  `bg-[#FF9500]/10 text-[#FF9500] border-transparent`
- Bed dots (line ~84): vacant `bg-green-500` → `bg-[#34C759]`; occupied `bg-red-500` → `bg-[#FF3B30]`
- Bed resident name (line ~90): `text-gray-500` → `text-[#8E8E93]` [inferred]
- Footer count (line ~101): `text-gray-500` → `text-[#8E8E93]` (brief: "Bed count text -> text-[#8E8E93]")
- Footer divider (line ~100): `border-gray-50` → `border-[#E5E5EA]` [inferred]
- Edit button (line ~106): `className="h-7 px-2 text-xs rounded-lg"` → `className="h-7 px-2 text-xs"`
  (remove rounded-lg; Apple outline) (brief: "Deactivate/Edit buttons: Apple outline style")
- Deactivate/Activate button (line ~112): currently `variant="outline" size="sm"` with a `cn(...)`
  color override (`text-red-600 border-red-200 hover:bg-red-50` when active, `text-green-600 ...` when
  inactive) + `className="h-7 px-2 text-xs rounded-lg"`. Per brief ("Apple outline style") → drop the
  color `cn(...)` override and the `rounded-lg`; render as plain outline: `className="h-7 px-2 text-xs"`.
  KEEP the `Power` icon, the `Deactivate`/`Activate` label, the `onClick={() => onToggleActive(room._id)}`,
  and `disabled={toggling}`. (Drift: this removes the red/green color coding — explicitly per brief
  "Apple outline style".)

### 1.3 `components/plans/PlansClient.tsx`  (ALREADY ~95% DONE — only the list isActive control remains)
Already done — DO NOT redo: heading (`text-[22px] font-semibold text-[#1C1C1E]` ~line 113), Add Plan
button default variant (~117), desktop table container `bg-white rounded-2xl overflow-hidden
shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]` (~142), table header + row hover (via
primitive), type badge `bg-[#007AFF]/10 text-[#007AFF]` (~184), meal badges (~215–228 and ~316–318),
active/inactive badges (~248–253, ~309–314), mobile cards `rounded-2xl border border-[#E5E5EA]` (~306),
dialog form `isActive` **already a `<ToggleSwitch checked={isActive} onChange={(v) => setValue('isActive', v)} color="blue" />`** (~429), dialog inputs (no rounded-lg), meal checkboxes `accent-[#007AFF]` (~415).
`ToggleSwitch` is already imported (~line 33). `handleToggleActive` is defined (~line 144).

- REMAINING — list `isActive` control. The brief says: replace with
  `<ToggleSwitch checked={plan.isActive} onChange={() => handleToggleActive(plan._id)} color='blue' />`.
  - DRIFT: there is NO hand-rolled `<button>+<span>` knob in the list. The list uses a labeled
    Deactivate/Activate `<Button>` that calls `handleToggleActive(plan._id)`:
    - Desktop actions cell (~lines 263–274): the `<Button ... onClick={() => handleToggleActive(plan._id)} ...>{plan.isActive ? 'Deactivate' : 'Activate'}</Button>`. REPLACE this `<Button>...</Button>` with
      `<ToggleSwitch checked={plan.isActive} onChange={() => handleToggleActive(plan._id)} color="blue" />`.
      KEEP the sibling Edit `<Button>` (the one with `onClick={() => openEditDialog(plan)}`).
    - Mobile card actions (~lines 326–332): same — REPLACE the Deactivate/Activate `<Button>` with
      `<ToggleSwitch checked={plan.isActive} onChange={() => handleToggleActive(plan._id)} color="blue" />`.
      KEEP the sibling Edit `<Button>`.
  - NOTE for reviewer/fixer: this swaps a labeled "Deactivate/Activate" button for a bare iOS switch
    in each plan row (a user-visible UX change — the text label is removed). It is explicitly requested
    by the brief (`checked={plan.isActive} onChange={() => handleToggleActive(plan._id)}`), which targets
    the LIST (the plan's actual state + the list toggle handler), not the dialog form field. Implement it.
- Meal badges minor: brief lists only `bg-[color]/10 text-[color]`; current badges add a subtle
  `border border-[color]/20`. The tints already match — LEAVE as-is (do not churn). DONE.

### 1.4 `components/residents/ResidentsList.tsx`  (NOT done)
- Heading (line ~124): `text-2xl font-bold text-gray-900` → `text-[22px] font-semibold text-[#1C1C1E]`
- Count badge (line ~126): `text-blue-600 border-blue-200 bg-blue-50` →
  `bg-[#007AFF]/10 text-[#007AFF] border-transparent`
- "Add Resident" button (line ~130 AND empty-state ~line 166): remove
  `className="bg-green-600 hover:bg-green-700 text-white rounded-xl"` → default variant.
- Filter selects (lines ~139–180): each `SelectTrigger` has `className="w-36 rounded-lg bg-white"` or
  `"w-44 rounded-lg bg-white"` → remove `rounded-lg bg-white` (keep `w-36`/`w-44`).
- `STATUS_BADGE` (lines ~58–62):
  - active: `text-green-600 border-green-200 bg-green-50` → `bg-[#34C759]/10 text-[#34C759] border-transparent`
  - notice: `text-yellow-600 border-yellow-200 bg-yellow-50` → `bg-[#FF9500]/10 text-[#FF9500] border-transparent`
  - left: `text-gray-500 border-gray-200 bg-gray-50` → `bg-[#8E8E93]/10 text-[#8E8E93] border-transparent`
- Avatar initials circle (desktop ~line 199 AND mobile ~line 223):
  `bg-green-100 ... text-green-700` → `bg-[#007AFF]/10 text-[#007AFF]`
- Desktop table container (line ~188): `bg-white rounded-xl shadow-sm border border-gray-100` →
  `bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]`
- Table header row (line ~191): remove `className="bg-gray-50"` from `<TableRow>`.
- TableHead cells (lines ~193–199): remove `className="font-semibold text-gray-700"` (let the Apple
  primitive apply `text-xs uppercase tracking-wide font-medium text-[#8E8E93]`).
- Row hover (line ~202): `className="hover:bg-gray-50"` → remove (primitive sets `hover:bg-[#F2F2F7]/50`)
- Cell text colors (desktop rows ~205–237): name `text-gray-900` → `text-[#1C1C1E]`; mobile/room/plan/
  joining `text-gray-600` → `text-[#1C1C1E]`; em-dash `text-gray-400` → `text-[#8E8E93]` [inferred for consistency]
- View button (line ~236): `className="h-7 px-2 text-xs rounded-lg"` → `className="h-7 px-2 text-xs"`
  (remove rounded-lg)
- Mobile cards (line ~246): `bg-white rounded-xl shadow-sm border border-gray-100 p-4` →
  `bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E5E5EA] p-4`
- Mobile card text (~line 230+): name `text-gray-900` → `text-[#1C1C1E]`; mobile `text-gray-500` → `text-[#8E8E93]`;
  labels `text-gray-500` → `text-[#8E8E93]`; values `text-gray-800` → `text-[#1C1C1E]` [inferred]
- Empty state (lines ~161–171): tile `bg-gray-100` → `bg-[#F2F2F7]`; `Users` icon `text-gray-400` →
  `text-[#8E8E93]`; heading `text-gray-900` → `text-[#1C1C1E]`; subtitle `text-gray-500` → `text-[#8E8E93]`;
  Add Resident button remove bg-green-600.

### 1.5 `components/residents/ResidentProfile.tsx`  (NOT done)
- `STATUS_BADGE` (lines ~64–68):
  - active: `text-green-600 border-green-200 bg-green-50` → `bg-[#34C759]/10 text-[#34C759] border-transparent`
  - notice: `text-yellow-600 border-yellow-200 bg-yellow-50` → `bg-[#FF9500]/10 text-[#FF9500] border-transparent`
  - left: `text-gray-500 border-gray-200 bg-gray-50` → `bg-[#8E8E93]/10 text-[#8E8E93] border-transparent`
- Back link (line ~116): `text-gray-500 hover:text-gray-700` → `text-[#8E8E93] hover:text-[#1C1C1E]`
- Header Card (line ~119): `className="border-0 shadow-sm rounded-xl mb-6"` → `className="mb-6"`
  (brief: "Header card: remove border-0 override (let Apple Card show)")
- Avatar tile (line ~123): `bg-green-100 ... text-green-700` → `bg-[#007AFF]/10 text-[#007AFF]`
- Name (line ~129): `text-2xl font-bold text-gray-900` → `text-[22px] font-semibold text-[#1C1C1E]`
- Meta icons + text (~line 138): Home/ClipboardList/Phone `text-gray-400` → `text-[#8E8E93]`; meta text
  `text-gray-600` → `text-[#1C1C1E]` [inferred]
- Change Plan button (~line 148): `className="rounded-lg text-xs"` → `className="text-xs"` (remove rounded-lg)
- Give Notice button (~line 159): `className="rounded-lg text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"` →
  `className="text-xs text-[#FF9500] border-[#FF9500]/30 hover:bg-[#FF9500]/10"`
  (brief verbatim: "Give Notice button -> text-[#FF9500] border-[#FF9500]/30 hover:bg-[#FF9500]/10")
- Check Out button (~line 171): `className="rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50"` →
  `className="text-xs text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/10"`
  (brief verbatim: "Check Out button -> text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/10")
- Notice banner (~line 182): `bg-yellow-50 border border-yellow-200 ... text-yellow-800` + AlertTriangle
  `text-yellow-600` → `bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500]` + AlertTriangle `text-[#FF9500]`
  (brief: "Notice banner -> bg-[#FF9500]/10 border-[#FF9500]/20 text-[#FF9500]")
- TabsList (~line 192): `className="mb-4 bg-white border border-gray-100 rounded-xl p-1 flex-wrap h-auto gap-1"` →
  `className="mb-4 bg-[#F2F2F7] rounded-xl p-1 gap-1 h-auto flex-wrap"`
  (brief: "TabsList -> bg-[#F2F2F7] rounded-xl p-1 gap-1 h-auto flex-wrap, remove bg-white border border-gray-100")
  TabsTrigger already `rounded-lg` — leave.
- Overview cards 1 & 2 (lines ~200, ~230): `className="border-0 shadow-sm rounded-xl"` → remove (rely on Apple Card)
- Section titles (~line 204, ~234): `font-semibold text-gray-800` → `text-[15px] font-semibold text-[#1C1C1E]`
  (brief: "Overview card section titles -> text-[15px] font-semibold text-[#1C1C1E]")
- dl labels (dt, ~lines 208–247): `text-gray-500` → `text-[#8E8E93] text-xs`
- dl values (dd): `font-medium text-gray-900` → `text-[#1C1C1E] text-sm`
  (brief: "Labels -> text-[#8E8E93] text-xs, values -> text-[#1C1C1E] text-sm")
- Notes box (~line 222): `text-gray-700 bg-gray-50 p-2 rounded-lg` → `text-[#1C1C1E] bg-[#F2F2F7] p-2 rounded-lg` [inferred]
- "No ID or guardian" (~line 247): `text-gray-400` → `text-[#8E8E93]` [inferred]
- Plan history card (~line 257): `className="border-0 shadow-sm rounded-xl"` → remove
- Plan history title (~line 259): `font-semibold text-gray-800` → `text-[15px] font-semibold text-[#1C1C1E]`
- Plan history empty (~line 261): `text-gray-400` → `text-[#8E8E93]` [inferred]
- Plan history table header (~line 265): remove `className="bg-gray-50"` from `<TableRow>` (primitive header)
- Plan history "Current" badge (~line 282): `text-green-600 border-green-200 bg-green-50` →
  `bg-[#34C759]/10 text-[#34C759] border-transparent` (brief: "Plan history 'Current' badge -> bg-[#34C759]/10 text-[#34C759]")
- Placeholder cards (rent ~293, payments ~305, electricity ~317, deposit ~329):
  `className="border-0 shadow-sm rounded-xl"` → remove
- Placeholder icon tiles (brief verbatim tints):
  - rent (~line 296): `bg-yellow-50 ... text-yellow-500` → `bg-[#FF9500]/10 text-[#FF9500]` (keep `Receipt`)
  - payments (~line 308): `bg-blue-50 ... text-blue-500` → `bg-[#007AFF]/10 text-[#007AFF]` (keep `CreditCard`)
  - electricity (~line 320): `bg-orange-50 ... text-orange-500` → `bg-[#FF9500]/10 text-[#FF9500]` (keep `Zap`)
  - deposit (~line 332): `bg-purple-50 ... text-purple-500` → `bg-[#5856D6]/10 text-[#5856D6]` (keep `Landmark`)
  - Placeholder headings `text-gray-900` → `text-[#1C1C1E]`; subtitles `text-gray-500` → `text-[#8E8E93]` [inferred]
- Change Plan dialog (~line 345): `DialogContent className="sm:max-w-sm rounded-xl"` → `className="sm:max-w-sm"` (remove rounded-xl)
- planError box (~line 350): `bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg` →
  `bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 px-3 py-2 rounded-lg` (brief: "Success/error banners Apple tints")
- SelectTrigger (~line 356): `className="rounded-lg"` → remove
- Effective From Input (~line 365): `className="rounded-lg"` → remove
- Cancel button (~line 371): `className="flex-1 rounded-lg"` → `className="flex-1"`
- Change Plan submit button (~line 375): `className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"` →
  `className="flex-1"` (default variant; remove bg-green-600)
- Give Notice dialog (~line 383): `DialogContent className="sm:max-w-sm rounded-xl"` → `className="sm:max-w-sm"`
- noticeError box (~line 388): `bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg` →
  `bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 px-3 py-2 rounded-lg`
- Notice Date Input (~line 397): `className="rounded-lg"` → remove
- Notice-period info box (~line 401): `bg-yellow-50 border border-yellow-200 ... text-yellow-800` →
  `bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500]` [inferred — consistent with notice tint]
- Cancel button (~line 407): `className="flex-1 rounded-lg"` → `className="flex-1"`
- Record Notice button (~line 411): `className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"` →
  `className="flex-1 bg-[#FF9500] hover:bg-[#E68B00] text-white"` [inferred — brief does not list it, but
  bg-yellow-500 is non-Apple; matches the orange notice theme from old FEAT-004]
- Drift: brief does not explicitly list the Record Notice button color or the dialog notice info box;
  both are inferred for Apple consistency.

---

## Step 2 — FEAT-004: AddResidentForm + Settings  → maps to workflow step `code-feat-004`

### 2.1 `components/residents/AddResidentForm.tsx`  (NOT done — green throughout, hand-rolled toggles, NO sharing selector)
IMPORTANT: `selectedSharing` is UI-only state. Do NOT add it to `residentSchema`, do NOT submit it, do
NOT change `lib/validators/resident.ts` or `lib/services/checkin.ts` or the onSubmit notes-appending
logic. The food plan is still appended to `notes` exactly as today.

- Imports to add:
  - `import { ToggleSwitch } from '@/components/ui/toggle-switch';`
  - Add `Bed` to the existing `lucide-react` import (for the Triple sharing card). `BedDouble` is already
    imported (use for the Double card).
- State: after line ~110 (`const [wantsFood, setWantsFood] = useState(false);`) add:
  `const [selectedSharing, setSelectedSharing] = useState<'double' | 'triple' | ''>('');`
- roomPlans filter (lines ~149–153): change the predicate
  `(!roomSharingType || p.sharingType === roomSharingType)` → `(!selectedSharing || p.sharingType === selectedSharing)`
  (brief: "Room plans: filter to plans.filter(p => (p.type==='room'||p.type==='room_food') && (!selectedSharing || p.sharingType === selectedSharing))")
  Keep `roomSharingType`/`selectedRoomData` (still used by the "No room plans found for {roomSharingType} sharing" message).
- Room dropdown (line ~346): `{rooms.map((r) => (` →
  `{rooms.filter((r) => !selectedSharing || r.sharingType === selectedSharing).map((r) => (`
  (brief: "Room dropdown: filter to rooms.filter(r => !selectedSharing || r.sharingType === selectedSharing)")
- Sharing selector cards: INSERT at the TOP of Step 1 — immediately after line ~336
  (`<div className="space-y-5">`) and BEFORE line ~337 (`{/* Room + Bed row */}`):
```
                {/* Sharing type selector */}
                <div className="space-y-2">
                  <Label>Sharing Type <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSharing('double');
                        setValue('room', '');
                        setValue('bed', '');
                        setValue('currentPlan', '');
                        setSelectedFoodPlanId('');
                        setWantsFood(false);
                        setVacantBeds([]);
                      }}
                      className={cn(
                        'border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2 text-center',
                        selectedSharing === 'double'
                          ? 'border-[#007AFF] bg-[#007AFF]/5'
                          : 'border-[#E5E5EA] bg-white hover:border-[#007AFF]/30'
                      )}
                    >
                      <BedDouble className="w-6 h-6 text-[#007AFF]" />
                      <span className="text-sm font-semibold text-[#1C1C1E]">Double Sharing</span>
                      <span className="text-xs text-[#8E8E93]">Rs 5,000/mo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSharing('triple');
                        setValue('room', '');
                        setValue('bed', '');
                        setValue('currentPlan', '');
                        setSelectedFoodPlanId('');
                        setWantsFood(false);
                        setVacantBeds([]);
                      }}
                      className={cn(
                        'border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2 text-center',
                        selectedSharing === 'triple'
                          ? 'border-[#007AFF] bg-[#007AFF]/5'
                          : 'border-[#E5E5EA] bg-white hover:border-[#007AFF]/30'
                      )}
                    >
                      <Bed className="w-6 h-6 text-[#007AFF]" />
                      <span className="text-sm font-semibold text-[#1C1C1E]">Triple Sharing</span>
                      <span className="text-xs text-[#8E8E93]">Rs 4,500/mo</span>
                    </button>
                  </div>
                </div>
```
  Verbatim brief classes: cards `border-2 rounded-2xl p-4 cursor-pointer transition-all`; selected
  `border-[#007AFF] bg-[#007AFF]/5`; unselected `border-[#E5E5EA] bg-white hover:border-[#007AFF]/30`.
  Text labels verbatim: "Double Sharing Rs 5,000/mo" / "Triple Sharing Rs 4,500/mo". Icons: `BedDouble`
  (Double), `Bed` (Triple). On change: clear room/bed/plan/food + `setVacantBeds([])`.

- TOGGLE — wantsFood (block ~lines 476–503; signature: `onClick` toggling `setWantsFood`, track
  `'w-10 h-5 rounded-full transition-colors relative flex-shrink-0'`, knob `translate-x-5`; preceded by
  the `{/* Toggle */}` comment ~line 474): replace the ENTIRE `<button>...</button>` (the outer button
  AND its inner track `<div>`+knob `<span>`) with a non-button row so the ToggleSwitch is the single
  source of truth (the old button onClick would double-toggle with the switch):
```
                  <div
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between',
                      wantsFood
                        ? 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]'
                        : 'border-dashed border-[#E5E5EA] text-[#8E8E93] hover:border-[#FF9500]/40'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      {wantsFood ? 'Food plan selected — tap to remove' : 'Add food plan for this resident'}
                    </span>
                    <ToggleSwitch checked={wantsFood} onChange={(v) => { setWantsFood(v); if (!v) setSelectedFoodPlanId(''); }} color="orange" />
                  </div>
```
  (brief verbatim handler: `onChange={(v) => { setWantsFood(v); if (!v) setSelectedFoodPlanId(''); }} color='orange'`)
  Drift: brief says "wantsFood toggle button -> <ToggleSwitch ...>"; the original was a `<button>` whose
  body was clickable AND had a hand-rolled knob. Converting to a `<div>` row (label left, switch right)
  with no row onClick prevents a double-toggle. The "tap to remove" text now toggles via the switch only.

- TOGGLE — depositReceived (block ~lines 640–651; signature: `onClick={() => setValue('depositReceived', !depositReceived)}`,
  track `'w-12 h-6 rounded-full transition-colors relative flex-shrink-0'`, knob `translate-x-6`): replace
  the entire `<button>...</button>` with
  `<ToggleSwitch checked={depositReceived} onChange={(v) => setValue('depositReceived', v)} color="green" />`
  KEEP the surrounding `<div className="flex items-center justify-between py-1">` and the label `<div>`
  ("Deposit received now?" / "Record the receipt immediately").

- TOGGLE — recordFirstPayment (block ~lines 721–736; signature: `onClick` setting `setValue('recordFirstPayment', next)`
  + `setValue('firstPaymentAmount', firstMonthRent)`, track `'w-12 h-6 rounded-full ...'`, knob `translate-x-6`):
  replace the entire `<button>...</button>` with
  `<ToggleSwitch checked={recordFirstPayment} onChange={(v) => { setValue('recordFirstPayment', v); if (v) setValue('firstPaymentAmount', firstMonthRent); }} color="green" />`
  KEEP the surrounding `<div className="flex items-center justify-between py-1">` and the label `<div>`
  ("Record first payment now?" / "Mark rent as paid immediately").
  (brief verbatim handler for both green toggles.)

- Room plan cards (mandatory, ~lines 416–461):
  - selected border/bg: `border-green-500 bg-green-50` → `border-[#007AFF] bg-[#007AFF]/5`
    (brief: "Plan cards (room): selected state -> border-[#007AFF] bg-[#007AFF]/5")
  - unselected: `border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/40` →
    `border-[#E5E5EA] bg-white hover:border-[#007AFF]/30` [inferred]
  - tile: selected `bg-green-500 text-white` → `bg-[#007AFF] text-white`
    (brief: "tile bg-[#007AFF] text-white (replace green)"); unselected `bg-gray-100 text-gray-500` →
    `bg-[#F2F2F7] text-[#8E8E93]` [inferred]
  - name: selected `text-green-800` → `text-[#1C1C1E]`; unselected `text-gray-800` → `text-[#1C1C1E]` [inferred]
  - price: `text-green-700`/`text-gray-700` → `text-[#1C1C1E]`; `/mo` `text-gray-400` → `text-[#8E8E93]` [inferred]
  - radio dot: selected `border-green-500 bg-green-500` → `border-[#007AFF] bg-[#007AFF]`; unselected
    `border-gray-300` → `border-[#E5E5EA]` [inferred]
  - Section header: `BedDouble text-green-600` → `text-[#007AFF]`; Mandatory badge
    `text-green-700 border-green-200 bg-green-50` → `text-[#007AFF] border-transparent bg-[#007AFF]/10` [inferred]
  - "Room charge is always included." `text-gray-500` → `text-[#8E8E93]` [inferred]
  - No-room hint: `border-dashed border-gray-200 text-gray-400` → `border-dashed border-[#E5E5EA] text-[#8E8E93]` [inferred]
  - No-room-plans hint: `border-amber-200 bg-amber-50 text-amber-700` →
    `border-[#FF9500]/20 bg-[#FF9500]/10 text-[#FF9500]` [inferred]

- Food plan cards (optional, ~lines 509–551):
  - selected: `border-orange-400 bg-orange-50` → `border-[#FF9500] bg-[#FF9500]/10`
    (brief: "Food plan cards: selected -> border-[#FF9500] bg-[#FF9500]/10")
  - unselected: `border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40` →
    `border-[#E5E5EA] bg-white hover:border-[#FF9500]/30` [inferred]
  - tile: selected `bg-orange-400 text-white` → `bg-[#FF9500] text-white`
    (brief: "tile bg-[#FF9500] text-white (replace orange-400)"); unselected `bg-gray-100 text-gray-500` →
    `bg-[#F2F2F7] text-[#8E8E93]` [inferred]
  - name: `text-orange-800`/`text-gray-800` → `text-[#1C1C1E]`; price `text-orange-700`/`text-gray-700` →
    `text-[#1C1C1E]`; `/mo` `text-gray-400` → `text-[#8E8E93]` [inferred]
  - radio dot: selected `border-orange-400 bg-orange-400` → `border-[#FF9500] bg-[#FF9500]`; unselected
    `border-gray-300` → `border-[#E5E5EA]` [inferred]
  - Section header: `Utensils text-orange-500` → `text-[#FF9500]`; Optional badge
    `text-orange-600 border-orange-200 bg-orange-50` → `text-[#FF9500] border-transparent bg-[#FF9500]/10` [inferred]
  - "Add meals if the resident wants food service." `text-gray-500` → `text-[#8E8E93]` [inferred]

- Price summary (~lines 556–577): `bg-gray-50 border border-gray-200` → `bg-[#F2F2F7] border border-[#E5E5EA]`;
  "Monthly Summary" `text-gray-500` → `text-[#8E8E93]`; labels `text-gray-600` → `text-[#8E8E93]`; total
  `text-green-700` → `text-[#1C1C1E]` (brief: total -> text-[#1C1C1E]); border-t `border-gray-200` →
  `border-[#E5E5EA]`; "Food plan" select-hint `text-amber-600` → `text-[#FF9500]` [inferred]

- Stepper (~lines 259–289):
  - active/complete circle: `bg-green-600 text-white` → `bg-[#007AFF] text-white`
  - current circle: `bg-green-600 text-white ring-4 ring-green-100` → `bg-[#007AFF] text-white ring-4 ring-[#007AFF]/20`
    (brief: "circles active/complete bg-[#007AFF] text-white ring-[#007AFF]/20 (replace green)")
  - inactive circle: `bg-gray-100 text-gray-400` → `bg-[#F2F2F7] text-[#8E8E93]` [inferred]
  - step labels: `text-green-700` → `text-[#007AFF]`; `text-gray-600` → `text-[#1C1C1E]`; `text-gray-400` → `text-[#8E8E93]` [inferred]
  - connector: `bg-green-500` → `bg-[#007AFF]`; `bg-gray-200` → `bg-[#E5E5EA]` [inferred]
- Step header CardTitle (~line 297): icon `text-green-600` → `text-[#007AFF]` (brief: "step header icon
  text-[#007AFF]"); title `text-gray-800` → `text-[#1C1C1E]` [inferred]
- Main Card (~line 294): `className="border-0 shadow-sm rounded-2xl"` → remove `border-0 shadow-sm` (rely on
  Apple Card primitive; keep `rounded-2xl` or drop — primitive is rounded-2xl) [inferred]
- Error banner (~line 302): `bg-red-50 border border-red-200 text-red-700` →
  `bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20` (brief verbatim)
- ID-upload info banner (~line 339): `bg-blue-50 border border-blue-200 ... text-blue-700` + Info
  `text-blue-500` → `bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20` + Info `text-[#007AFF]`
  (brief verbatim)
- Inputs/Selects: the `className="rounded-xl h-10"` overrides are NOT in the brief's remove-list for this
  file; LEAVE them (they are Apple-ish and not green/knobs). Do not churn them.
- Security Deposit section (~line 620): border `border-gray-200` → `border-[#E5E5EA]`; deposit icon tile
  `bg-blue-50 text-blue-600` → `bg-[#007AFF]/10 text-[#007AFF]`; "Security Deposit" `text-gray-800` →
  `text-[#1C1C1E]`; "Deposit received now?" `text-gray-700` → `text-[#1C1C1E]`; sub `text-gray-400` →
  `text-[#8E8E93]`; nested panel `border-l-2 border-green-200` → `border-l-2 border-[#34C759]/30`
  (brief: "Deposit/rent section border-l: border-[#34C759]/30")
- First Month Rent section (~line 677): border `border-gray-200` → `border-[#E5E5EA]`; icon tile
  `bg-green-50 text-green-600` → `bg-[#34C759]/10 text-[#34C759]` [inferred]; "First Month Rent"
  `text-gray-800` → `text-[#1C1C1E]`; rent preview box `bg-green-50 border border-green-200` →
  `bg-[#F2F2F7] border border-[#E5E5EA]` [inferred]; labels `text-gray-600` → `text-[#8E8E93]`; values
  `text-gray-800` → `text-[#1C1C1E]`; border-t `border-green-200` → `border-[#E5E5EA]`;
  "First month (prorated)"/"Monthly amount" `text-gray-700` → `text-[#1C1C1E]`; amount `text-green-700` →
  `text-[#1C1C1E]`; "Select a plan in Step 2" hint `bg-gray-50 border-gray-200 text-gray-500` →
  `bg-[#F2F2F7] border-[#E5E5EA] text-[#8E8E93]` [inferred]; "Record first payment now?" `text-gray-700` →
  `text-[#1C1C1E]`; sub `text-gray-400` → `text-[#8E8E93]`; nested panel `border-l-2 border-green-200` →
  `border-l-2 border-[#34C759]/30`
- Nav buttons (~lines 780, 790, 799):
  - Back/Cancel: `variant="outline" className="rounded-xl px-6 h-10"` → `variant="outline" className="px-6 h-10"`
    (brief: "Back/Cancel -> outline variant")
  - Next: `className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-10"` → `className="px-6 h-10"`
    (default variant; remove bg-green-600)
  - Submit: `className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-10"` → `className="px-6 h-10"`

### 2.2 `components/settings/SettingsForm.tsx`  (ALREADY FULLY DONE — verify only, two optional tweaks)
This file is complete. Confirmed by reading:
- `ToggleSwitch` imported (line ~18); prorate row ALREADY renders
  `<ToggleSwitch checked={prorateFirstMonth} onChange={(v) => setValue('prorateFirstMonth', v)} color="green" />`
  (~lines 240–243). DO NOT re-add a hand-rolled toggle.
- TabsList uses the Apple primitive (only `className="mb-6 w-full"` layout helpers).
- All `Card`s use Apple defaults; all `CardTitle` are `text-[15px] font-semibold text-[#1C1C1E]`.
- Inputs rely on the primitive (no `rounded-lg`); textarea is `rounded-xl border border-[#E5E5EA] ...`.
- Billing radios are `accent-[#007AFF]`.
- Save buttons + Change Password button are default variant (no bg-green).
- Success banners `bg-[#34C759]/10 text-[#34C759]`; error banners `bg-[#FF3B30]/10 text-[#FF3B30]`.

Optional cosmetic tweaks (brief mentions them; not required for build/grep to pass):
- prorate row: brief says `<div className='flex items-center justify-between py-2'>`. Current row lacks
  `py-2`. Add `py-2` if desired.
- success/error banners: brief lists `border-[#34C759]/20` / `border-[#FF3B30]/20`. Current banners have
  no border. Optionally add `border border-[#34C759]/20` / `border border-[#FF3B30]/20`.

Do NOT otherwise change this file.

---

## Step 3 — Convergence / final build pass  → maps to workflow `fix-loop`

1. Run `npm run build`. It MUST pass with **0 TypeScript errors**.
2. Common errors to fix: missing `Image`/`ToggleSwitch` imports; ToggleSwitch called with the wrong prop
   names (it is `checked`/`onChange`, NOT `value`/`onValueChange`); a leftover `setValue` arg type
   mismatch; an unused `Building2` import in login (remove it).
3. After build is green, run the grep checks below and ensure they pass.

---

## Toggles (all 7)

| # | File | Field | Approx lines (button block) | Color | onChange handler |
|---|------|-------|------------------------------|-------|------------------|
| 1 | components/rooms/RoomsClient.tsx | hasSubMeter | ~319–333 (signature: `setValue('hasSubMeter', !hasSubMeter)` + `w-11 h-6 rounded-full` track) | blue | `(v) => setValue('hasSubMeter', v)` |
| 2 | components/rooms/RoomsClient.tsx | isActive | ~339–352 (signature: `setValue('isActive', !isActive)` + `w-11 h-6 rounded-full` track) | blue | `(v) => setValue('isActive', v)` |
| 3 | components/plans/PlansClient.tsx | isActive (list row) | desktop Deactivate/Activate Button ~265–274; mobile ~326–332 (calls `handleToggleActive(plan._id)`) | blue | `() => handleToggleActive(plan._id)` |
| 4 | components/residents/AddResidentForm.tsx | wantsFood | ~476–503 (signature: `setWantsFood` toggle + `w-10 h-5 rounded-full` track + knob `translate-x-5`; `{/* Toggle */}` comment ~474) | orange | `(v) => { setWantsFood(v); if (!v) setSelectedFoodPlanId(''); }` |
| 5 | components/residents/AddResidentForm.tsx | depositReceived | ~640–651 (signature: `setValue('depositReceived', !depositReceived)` + `w-12 h-6 rounded-full` track + knob `translate-x-6`) | green | `(v) => setValue('depositReceived', v)` |
| 6 | components/residents/AddResidentForm.tsx | recordFirstPayment | ~721–736 (signature: `setValue('recordFirstPayment', next)` + `setValue('firstPaymentAmount', firstMonthRent)` + `w-12 h-6 rounded-full` track + knob `translate-x-6`) | green | `(v) => { setValue('recordFirstPayment', v); if (v) setValue('firstPaymentAmount', firstMonthRent); }` |
| 7 | components/settings/SettingsForm.tsx | prorateFirstMonth | ALREADY a `<ToggleSwitch>` (~240–243) — NO CHANGE | green | `(v) => setValue('prorateFirstMonth', v)` (already in place) |

Notes:
- Toggles 1, 2, 4, 5, 6 are hand-rolled `<button type="button">` + `<span>` knobs → replace with
  `<ToggleSwitch>`. Toggle 3 is a labeled Deactivate/Activate `<Button>` (no knob) → replace with
  `<ToggleSwitch>` (per brief; this removes the "Deactivate/Activate" text label — explicitly requested).
  Toggle 7 is already done.
- For the three AddResidentForm green/orange toggles: keep each surrounding
  `<div className="flex items-center justify-between ...">` + label; only swap the `<button>...</button>`
  for the `<ToggleSwitch>` (for wantsFood, convert the outer `<button>` to a `<div>` row — see §2.1).
- Line numbers are from ripgrep; its context display can be ±1. Match each block by its content signature.

---

## Verification (exact commands the fixer runs)

Run from the project root `c:/Users/Adarsh/Desktop/agency/demo-demand/PG`.

1. Build (the hard gate — must exit 0):
```
npm run build
```

2. No leftover green button colors (expect 0 matches, or only matches that are NOT on a `<Button>`/`<button>`):
```
grep -rnE 'bg-green-(500|600)' c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components c:/Users/Adarsh/Desktop/agency/demo-demand/PG/app
```

3. No leftover hand-rolled toggle knobs in the four toggle files (expect 0 matches — the knob `translate-x`
   now lives only inside `components/ui/toggle-switch.tsx`):
```
grep -rn 'translate-x' c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components/rooms/RoomsClient.tsx c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components/plans/PlansClient.tsx c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components/residents/AddResidentForm.tsx c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components/settings/SettingsForm.tsx
```

Sanity (should still have matches — confirms the switch component itself is intact):
```
grep -n 'translate-x' c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components/ui/toggle-switch.tsx
```

4. Logo wired via next/image (expect 3 matches — Sidebar, login, TopBar):
```
grep -rn "src='/logo.png'" c:/Users/Adarsh/Desktop/agency/demo-demand/PG/components c:/Users/Adarsh/Desktop/agency/demo-demand/PG/app
```

Acceptance: build passes with 0 TS errors; grep #2 returns nothing on buttons; grep #3 returns nothing;
grep #4 returns 3 matches. The reviewer writes the verdict to
`c:/Users/Adarsh/Desktop/agency/demo-demand/PG/.agents/tasks/apple-ui/review.json` with top-level
`verdict` == `APPROVED` when all the above hold.

---

## Drift summary (brief vs. actual files)

- PlansClient: brief assumes a "hand-rolled button+span" isActive toggle; the actual list uses a labeled
  Deactivate/Activate `<Button>` (the dialog form field is already a ToggleSwitch). Replace the list
  button with the list `<ToggleSwitch>` per brief (§1.3).
- RoomCard: brief says "remove rounded-xl override (Card primitive is now rounded-2xl)" assuming a
  `<Card>`; actual is a plain `<div>` → apply `rounded-2xl` + Apple shadow + `border-[#E5E5EA]` to the div (§1.2).
- AddResidentForm wantsFood: brief says "toggle button -> ToggleSwitch"; the original outer element is a
  `<button>` whose whole body is clickable with a hand-rolled knob. Convert to a `<div>` row (label left,
  switch right, no row onClick) to avoid a double-toggle (§2.1).
- SettingsForm: already complete incl. the prorate ToggleSwitch. Only two optional cosmetic tweaks (§2.2).
- Several cell/label color conversions in ResidentsList/ResidentProfile/RoomCard/AddResidentForm are
  marked "[inferred]" — not explicitly in the brief but required for Apple-token consistency. They do
  not change behavior.
