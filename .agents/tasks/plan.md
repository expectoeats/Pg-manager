# Implementation Plan — PG Admin Panel Pages

## Project Context

- **Framework**: Next.js 16.4.3 (App Router, TypeScript), verified from `package.json`
- **Route group**: `app/(dashboard)/` — the `(dashboard)` segment is NOT in the URL. So `app/(dashboard)/residents/page.tsx` is served at `/residents`, NOT `/dashboard/residents`.
- **Root cause of 404s**: Sidebar/BottomNav links point to `/dashboard/residents`, `/dashboard/rooms`, etc. but the actual URLs are `/residents`, `/rooms`, etc. The `/dashboard` URL is served by `app/(dashboard)/dashboard/page.tsx`.
- **Build command**: `npm run build` (runs `next build`)
- **Dev command**: `npm run dev`
- **Auth pattern**: Server components call `auth()` from `@/lib/auth`. Client components use `next-auth/react`.
- **Service pattern**: `'use server'` at top of file, auth check first, zod parse, `connectDB()`, Mongoose operation, `ActivityLog.create(...)`, return `{ success, error?, data? }`. See `lib/services/settings.ts`.
- **Validator pattern**: zod schema + exported `type FormData = z.infer<typeof schema>`. See `lib/validators/settings.ts`.
- **Page pattern**: async Server Component, fetches data via service, passes to Client Component. See `app/(dashboard)/settings/page.tsx` + `components/settings/SettingsForm.tsx`.
- **UI components available**: Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Dialog, Sheet, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Select, Separator, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Toast/Toaster, DropdownMenu — all in `components/ui/`.
- **Styling**: Tailwind CSS. Use `cn()` from `@/lib/utils`. Border-0 shadow-sm rounded-xl on cards. Green-500/600 for primary actions. Status colors: green=active/paid/vacant, yellow=partial/notice, red=pending/overdue, gray=left.
- **Money**: integers in rupees (no decimals), never `toFixed` for storage.
- **Dates**: stored UTC, displayed in IST: `new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })`.
- **`revalidatePath`**: call with the correct non-dashboard path, e.g. `revalidatePath('/rooms')` not `revalidatePath('/dashboard/rooms')`.

---

## Implementation Plan

- [ ] 1. **Fix routing: correct all hrefs in Sidebar and BottomNav**

  The `(dashboard)` route group means URLs are `/dashboard`, `/residents`, `/rooms`, etc. — not `/dashboard/residents`, `/dashboard/rooms`, etc. All nav items in both components must be updated.

  Files:
  - `components/layout/Sidebar.tsx` — update `navItems` array: change all hrefs except `/dashboard` to drop the `/dashboard/` prefix. Specifically:
    - `/dashboard/residents` → `/residents`
    - `/dashboard/rooms` → `/rooms`
    - `/dashboard/plans` → `/plans`
    - `/dashboard/rent` → `/rent`
    - `/dashboard/payments` → `/payments`
    - `/dashboard/deposits` → `/deposits`
    - `/dashboard/electricity` → `/electricity`
    - `/dashboard/expenses` → `/expenses`
    - `/dashboard/reports` → `/reports`
    - `/dashboard/settings` → `/settings`
    - `/dashboard/activity` → `/activity-log` (also rename the label to match the route)
  - `components/layout/BottomNav.tsx` — update `bottomNavItems`: `/dashboard/residents` → `/residents`, `/dashboard/rent` → `/rent`. The `/dashboard/more` entry has no page; change it to `/settings` for now.

  Also update `isActive` logic: the current check `pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))` stays valid after the href fix.

  Verify: `npm run build` — no TypeScript errors. Navigate to each link in the browser; all should return 200.

---

- [ ] 2. **Rename activity folder and fix the activity-log route**

  The spec requires route `/activity-log`. The folder is currently `app/(dashboard)/activity/`. Rename it.

  Files:
  - Delete `app/(dashboard)/activity/page.tsx`
  - Create `app/(dashboard)/activity-log/page.tsx` with same placeholder content (the full implementation is Phase 8; just keep the heading and "Phase 8 — coming soon." text).

  The Sidebar fix in item 1 already points to `/activity-log`, so this completes the routing.

  Verify: `npm run build` — no errors. `GET /activity-log` returns 200.

---

- [ ] 3. **Create validators: `lib/validators/room.ts` and `lib/validators/plan.ts`**

  Follow the pattern in `lib/validators/settings.ts` exactly.

  **`lib/validators/room.ts`**:
  ```ts
  import { z } from 'zod';
  export const roomSchema = z.object({
    roomNumber: z.string().min(1, 'Room number is required'),
    sharingType: z.enum(['double', 'triple']),
    totalBeds: z.coerce.number().int().min(1).max(10),
    floor: z.string().optional(),
    isActive: z.boolean().default(true),
    hasSubMeter: z.boolean().default(false),
  });
  export type RoomFormData = z.infer<typeof roomSchema>;
  ```

  **`lib/validators/plan.ts`**:
  ```ts
  import { z } from 'zod';
  export const planSchema = z.object({
    name: z.string().min(1, 'Plan name is required'),
    type: z.enum(['room', 'room_food', 'food_only']),
    sharingType: z.enum(['double', 'triple', 'none']).default('none'),
    includesBreakfast: z.boolean().default(false),
    includesLunch: z.boolean().default(false),
    includesDinner: z.boolean().default(false),
    price: z.coerce.number().int().min(0, 'Price must be a non-negative integer'),
    isActive: z.boolean().default(true),
  });
  export type PlanFormData = z.infer<typeof planSchema>;
  ```

  Files: `lib/validators/room.ts`, `lib/validators/plan.ts`

  Verify: `npm run build` — TypeScript compiles clean.

---

- [ ] 4. **Create service: `lib/services/rooms.ts`**

  Follow the exact pattern from `lib/services/settings.ts`: `'use server'` at top, auth check, zod parse, `connectDB()`, Mongoose, `ActivityLog.create()`, return `{ success, error?, data? }`. Use `revalidatePath('/rooms')`.

  Implement these exported async functions:

  - `getRooms()` — `Room.find({}).sort({ roomNumber: 1 }).lean()` — no auth required (read-only, called from server component).
  - `getRoomWithBeds(roomId: string)` — `Room.findById(roomId).lean()` + `Bed.find({ room: roomId }).populate('currentResident', 'name').lean()` — returns `{ room, beds }`.
  - `createRoom(data: unknown)` — auth, zod parse with `roomSchema`, check no room exists with same `roomNumber` (`Room.findOne({ roomNumber })`; if exists return `{ success: false, error: 'Room number already exists' }`), create room with `Room.create(parsed)`, then create beds: loop `totalBeds` times creating `Bed` docs with `bedLabel` = `['A','B','C','D','E','F','G','H','I','J'][i]`, `room` = room._id, `status = 'vacant'`. Log activity. Return `{ success: true }`. Call `revalidatePath('/rooms')`.
  - `updateRoom(roomId: string, data: unknown)` — auth, zod parse, check for duplicate roomNumber (excluding self: `Room.findOne({ roomNumber, _id: { $ne: roomId } })`), `Room.findByIdAndUpdate`, log activity, `revalidatePath('/rooms')`. Note: do NOT add/remove beds automatically on update (beds are structural; changing totalBeds on a room with active residents would be destructive). Return `{ success: true }`.
  - `toggleRoomActive(roomId: string)` — auth, check if any bed in room has `status: 'occupied'` (`Bed.findOne({ room: roomId, status: 'occupied' })`); if yes return `{ success: false, error: 'Cannot deactivate a room with occupied beds' }`. Toggle `isActive`, log, revalidate, return `{ success: true }`.

  Files: `lib/services/rooms.ts`

  Verify: `npm run build` — no TypeScript errors.

---

- [ ] 5. **Build the Rooms page: `app/(dashboard)/rooms/page.tsx` + `components/rooms/RoomsClient.tsx`**

  The page is a Server Component that fetches data and passes it to a Client Component (same pattern as Settings).

  **`app/(dashboard)/rooms/page.tsx`** (Server Component):
  - Call `getRooms()` and for each room also get bed counts from a single aggregation or just pass rooms list. For simplicity, do `Room.find({}).lean()` + `Bed.find({}).lean()` and group beds by room on the server. Actually: call a new service helper `getRoomsWithBedSummary()` (add to `lib/services/rooms.ts`) that returns `Array<{ room: IRoom, beds: IBed[] }>`.
  - Render page title "Rooms & Beds" and pass data to `<RoomsClient rooms={roomsWithBeds} />`.

  **`components/rooms/RoomsClient.tsx`** (Client Component, `'use client'`):

  State: `dialogOpen` (add/edit), `selectedRoom` (null = add mode), `confirmDeactivate` (roomId|null).

  Layout:
  - Header row: "Rooms & Beds" title + filter buttons (All / Vacant only) + "Add Room" button.
  - Grid of Room Cards (responsive: 1 col mobile, 2 col md, 3 col lg).

  Each Room Card (`components/rooms/RoomCard.tsx`):
  - Shows: room number (large), floor (if set), sharing type badge, `hasSubMeter` badge.
  - Bed row: one colored circle per bed. Green circle = vacant (show bed label tooltip). Red circle = occupied (show resident name on hover/tap — use `title` attribute for simplicity).
  - Stats: `X/Y occupied` text.
  - Actions: Edit button (pencil icon), Active/Inactive toggle button.
  - isActive=false: show a gray "Inactive" overlay or badge.

  Add/Edit Dialog (shadcn `Dialog`):
  - Form fields: Room Number (Input), Floor (Input, optional), Sharing Type (Select: double/triple), Total Beds (Input number, min 1 max 10), Has Sub Meter (checkbox/toggle), Is Active (toggle, only shown in edit mode).
  - Use `react-hook-form` + `zodResolver(roomSchema)`.
  - On submit: call `createRoom(data)` or `updateRoom(id, data)` server action. Show error toast on failure, close dialog on success. Use `useTransition` + `startTransition` to wrap the server action call (per Next.js 16 pattern).
  - After success: call `router.refresh()` to re-fetch server data (since we use Server Component for data fetching).

  Note on bed display in edit mode: show a read-only info note "Bed count cannot be changed after creation. Contact support to restructure beds."

  Files: `app/(dashboard)/rooms/page.tsx`, `components/rooms/RoomsClient.tsx`, `components/rooms/RoomCard.tsx`

  Verify: `npm run build`. Navigate to `/rooms` — page loads, "Add Room" dialog opens.

---

- [ ] 6. **Create service: `lib/services/plans.ts`**

  Same pattern as rooms service.

  - `getPlans()` — `Plan.find({}).sort({ price: 1 }).lean()` — no auth.
  - `createPlan(data: unknown)` — auth, zod parse `planSchema`, `Plan.create(parsed)`, log, `revalidatePath('/plans')`, return `{ success: true }`.
  - `updatePlan(planId: string, data: unknown)` — auth, zod parse, `Plan.findByIdAndUpdate`, log, `revalidatePath('/plans')`, return `{ success: true }`. Note: price change on an existing plan does NOT retroactively affect existing RentRecords (that is enforced at rent-generation time by using `planSnapshot`; no special logic needed here).
  - `togglePlanActive(planId: string)` — auth, toggle `isActive`, log, `revalidatePath('/plans')`. Deactivating never affects existing residents (they keep their plan reference).

  Files: `lib/services/plans.ts`

  Verify: `npm run build` — clean.

---

- [ ] 7. **Build the Plans page: `app/(dashboard)/plans/page.tsx` + `components/plans/PlansClient.tsx`**

  **`app/(dashboard)/plans/page.tsx`** (Server Component): call `getPlans()`, render title "Plans", pass to `<PlansClient plans={plans} />`.

  **`components/plans/PlansClient.tsx`** (Client Component):

  State: `dialogOpen`, `selectedPlan` (null = add mode).

  Layout:
  - Header: "Plans" title + "Add Plan" button.
  - shadcn `Table` with columns: Name, Type, Meals, Price (₹), Status (badge), Actions (Edit + toggle active).
  - Meals column: show pill badges for B/L/D that are true (e.g., "🍳 Breakfast", "🍽 Dinner"). If none, show "—".
  - Status: green badge "Active" / gray badge "Inactive".
  - On mobile: table scrolls horizontally (`overflow-x-auto` wrapper).

  Add/Edit Dialog:
  - Fields: Name (Input), Type (Select: room/room_food/food_only), Sharing Type (Select: double/triple/none, shown only when type ≠ food_only), Price (Input number), Includes Breakfast (Switch/checkbox), Includes Lunch (Switch/checkbox), Includes Dinner (Switch/checkbox), Is Active (toggle, edit mode only).
  - `react-hook-form` + `zodResolver(planSchema)`.
  - Submit calls `createPlan(data)` or `updatePlan(id, data)`. Error toast on failure, `router.refresh()` on success.

  Files: `app/(dashboard)/plans/page.tsx`, `components/plans/PlansClient.tsx`

  Verify: `npm run build`. `/plans` loads, plans table visible, Add Plan dialog works.

---

- [ ] 8. **Create validator: `lib/validators/resident.ts`**

  ```ts
  import { z } from 'zod';

  const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile: starts with 6-9, exactly 10 digits

  export const residentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    mobile: z.string().regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number'),
    alternateMobile: z.string().regex(mobileRegex).optional().or(z.literal('')),
    guardianName: z.string().optional(),
    guardianMobile: z.string().regex(mobileRegex).optional().or(z.literal('')),
    idProofType: z.string().optional(),
    idProofNumber: z.string().optional(),
    room: z.string().min(1, 'Room is required'),
    bed: z.string().min(1, 'Bed is required'),
    currentPlan: z.string().min(1, 'Plan is required'),
    joiningDate: z.string().min(1, 'Joining date is required'), // ISO date string from <input type="date">
    notes: z.string().optional(),
    // Deposit fields
    depositAmount: z.coerce.number().int().min(0),
    depositReceived: z.boolean().default(false),
    depositMethod: z.enum(['cash', 'upi', 'bank']).optional(),
    // First rent fields
    recordFirstPayment: z.boolean().default(false),
    firstPaymentAmount: z.coerce.number().int().min(0).optional(),
    firstPaymentMethod: z.enum(['cash', 'upi', 'bank']).optional(),
  });

  export type ResidentFormData = z.infer<typeof residentSchema>;
  ```

  Files: `lib/validators/resident.ts`

  Verify: `npm run build` — clean.

---

- [ ] 9. **Create service: `lib/services/checkin.ts`**

  This is the most critical service — it runs the check-in flow from spec §5.1 inside a MongoDB transaction.

  ```ts
  'use server';
  // Uses mongoose.startSession() for transaction
  ```

  Import: `mongoose`, `connectDB`, `auth`, `Room`, `Bed`, `Resident`, `Deposit`, `RentRecord`, `PlanHistory`, `ActivityLog`, `Plan`, `Settings`, `revalidatePath`.

  Export `checkInResident(data: unknown)`:

  1. Auth check (return `{ success: false, error: 'Unauthorized' }` if no session).
  2. Zod parse with `residentSchema`.
  3. `await connectDB()`.
  4. Start mongoose session: `const session = await mongoose.startSession(); session.startTransaction()`.
  5. Wrap in try/catch; `session.abortTransaction()` + `session.endSession()` in catch.
  6. Inside transaction:
     a. Verify bed is still vacant: `Bed.findById(bedId).session(session)` — if `status !== 'vacant'` abort with error `'Bed is already occupied'`.
     b. Verify bed belongs to the chosen room: `bed.room.toString() === roomId`.
     c. `Resident.create([{ name, mobile, ..., room, bed, currentPlan, joiningDate: new Date(joiningDate), status: 'active' }], { session })` — returns array, take `[0]`.
     d. Mark bed occupied: `Bed.findByIdAndUpdate(bedId, { status: 'occupied', currentResident: resident._id }, { session })`.
     e. Create PlanHistory entry: `PlanHistory.create([{ resident: resident._id, plan: currentPlan, effectiveFrom: new Date(joiningDate), effectiveTo: null }], { session })`.
     f. Create Deposit: `Deposit.create([{ resident: resident._id, amount: depositAmount, status: depositReceived ? 'held' : 'pending', receivedDate: depositReceived ? new Date() : undefined }], { session })`.
     g. Generate first RentRecord: compute `amountDue` from plan price (fetch `Plan.findById(currentPlan).session(session)`). For first month with `billingMode === 'calendar'` and `prorateFirstMonth === true`, prorate: `const daysInMonth = new Date(year, month, 0).getDate(); const daysRemaining = daysInMonth - joiningDay + 1; amountDue = Math.round(planPrice * daysRemaining / daysInMonth)`. Use `YYYY-MM` format for month: `joiningDate.toISOString().slice(0,7)`. `RentRecord.create([{ resident: resident._id, month, planSnapshot: { name: plan.name, price: plan.price }, amountDue, amountPaid: 0, status: 'pending', dueDate: ... }], { session })`.
     h. If `recordFirstPayment === true` and `firstPaymentAmount > 0`: create a `Payment` doc — but Payment model doesn't exist yet in this phase, skip for now; leave a TODO comment.
     i. Log activity: `ActivityLog.create([{ user: session.user.id, action: 'CREATE', entityType: 'Resident', entityId: resident._id, summary: `Checked in ${name} to bed ${bedLabel}`, timestamp: new Date() }], { session: mongoSession })` (rename session variable to avoid conflict with auth session).
  7. `await mongoSession.commitTransaction(); mongoSession.endSession()`.
  8. `revalidatePath('/residents'); revalidatePath('/rooms');`
  9. Return `{ success: true, residentId: resident._id.toString() }`.

  Also export `getVacantBedsByRoom(roomId: string)` — `Bed.find({ room: roomId, status: 'vacant' }).lean()` — needed by the form.

  Files: `lib/services/checkin.ts`

  Verify: `npm run build` — no TypeScript errors. (Functional testing happens after the form is built.)

---

- [ ] 10. **Create service: `lib/services/residents.ts`**

  - `getResidents(filters?: { status?: string, planId?: string, roomId?: string })` — build a mongoose query object from filters, `Resident.find(query).populate('room', 'roomNumber').populate('bed', 'bedLabel').populate('currentPlan', 'name price').sort({ name: 1 }).lean()`. No auth (server component read).
  - `getResident(id: string)` — `Resident.findById(id).populate('room', 'roomNumber sharingType').populate('bed', 'bedLabel').populate('currentPlan', 'name price type').lean()`. Throws `notFound()` from `next/navigation` if null.
  - `givePlanChange(residentId: string, newPlanId: string, effectiveFrom: string)` — auth, connect, fetch current PlanHistory open entry (`PlanHistory.findOne({ resident: residentId, effectiveTo: null })`), close it (`effectiveTo = new Date(effectiveFrom)`), create new PlanHistory entry, update `Resident.currentPlan`, log, `revalidatePath('/residents'); revalidatePath(\`/residents/${residentId}\`)`. Return `{ success: true }`.
  - `giveNotice(residentId: string, noticeDate: string)` — auth, connect, fetch Settings for `noticePeriodDays`, compute `expectedLeavingDate = noticeDate + noticePeriodDays days`, update Resident `{ status: 'notice', noticeDate, expectedLeavingDate }`, log, revalidate, return `{ success: true }`.

  Files: `lib/services/residents.ts`

  Verify: `npm run build` — clean.

---

- [ ] 11. **Build Add Resident page: `app/(dashboard)/residents/new/page.tsx` + `components/residents/AddResidentForm.tsx`**

  **`app/(dashboard)/residents/new/page.tsx`** (Server Component):
  - Fetch `getRooms()` (only active rooms), `getPlans()` (only active plans), and `getSettings()`.
  - Pass as props to `<AddResidentForm rooms={rooms} plans={plans} settings={settings} />`.

  **`components/residents/AddResidentForm.tsx`** (Client Component, `'use client'`):

  Multi-step form with 4 steps shown as a stepper at the top:
  1. **Personal** — name (required), mobile (required, 10-digit Indian), alternateMobile, guardianName, guardianMobile.
  2. **Stay** — room (Select from active rooms), bed (Select, populated dynamically via `useEffect` calling a fetch to get vacant beds when room changes — use a client-side fetch to a route `/api/vacant-beds?roomId=X` OR better: on room select, call the `getVacantBedsByRoom(roomId)` server action directly via `startTransition`), plan (Select from active plans), joining date (date input).
  3. **ID Proof** — idProofType (Select: Aadhar/PAN/Passport/Voter ID/Driving License), idProofNumber (Input). (Skip file upload for now — add a note "File upload coming soon".)
  4. **Deposit & First Rent** — deposit amount (pre-filled from settings, editable), "Received now?" toggle, if yes: payment method select. "Record first payment?" toggle, if yes: amount (pre-filled from plan price, editable), method select. Show a preview: "First month rent: ₹X (prorated from joining date)".

  Navigation: "Back" / "Next" buttons between steps. On last step, "Submit" button.

  `useForm` with `zodResolver(residentSchema)`. The form spans all steps — validation is checked at submission.

  On submit: `checkInResident(formData)`. On success: `router.push('/residents')` + show success toast. On error: show error message inline.

  Files: `app/(dashboard)/residents/new/page.tsx`, `components/residents/AddResidentForm.tsx`

  Verify: `npm run build`. `/residents/new` renders the multi-step form.

---

- [ ] 12. **Build Residents list page: `app/(dashboard)/residents/page.tsx` + `components/residents/ResidentsList.tsx`**

  **`app/(dashboard)/residents/page.tsx`** (Server Component):
  - Read search params: `status`, `planId`, `roomId` from `searchParams` prop.
  - Call `getResidents(filters)`.
  - Also fetch `getPlans()` and `getRooms()` for filter dropdowns.
  - Pass all to `<ResidentsList residents={residents} plans={plans} rooms={rooms} initialFilters={filters} />`.

  **`components/residents/ResidentsList.tsx`** (Client Component):

  Desktop: shadcn `Table` with columns: Name (link to `/residents/[id]`), Mobile, Room/Bed, Plan, Joining Date, Status badge, Actions.
  Mobile: card list (one card per resident, showing name, room/bed, plan, status).

  Status badges: green = active, yellow = notice, gray = left.

  Filter row: Status select (All/Active/Notice/Left), Plan select, Room select. On change, update URL query params via `router.push` (use `useSearchParams` + `useRouter`). This triggers a server-side re-fetch.

  "Add Resident" button → `router.push('/residents/new')`.

  Empty state: "No residents found. Add your first resident!" with an illustration (use a simple SVG or the Users icon large).

  Files: `app/(dashboard)/residents/page.tsx`, `components/residents/ResidentsList.tsx`

  Verify: `npm run build`. `/residents` loads list (or empty state), filters work.

---

- [ ] 13. **Build Resident profile page: `app/(dashboard)/residents/[id]/page.tsx` + `components/residents/ResidentProfile.tsx`**

  **`app/(dashboard)/residents/[id]/page.tsx`** (Server Component):
  - Call `getResident(params.id)` (throws notFound if missing).
  - Fetch associated data in parallel: `PlanHistory.find({ resident: id }).populate('plan', 'name price').sort({ effectiveFrom: -1 }).lean()` — add a `getPlanHistory(residentId)` export to `lib/services/residents.ts`.
  - Fetch `getPlans()` for the "Change Plan" dialog.
  - Pass all to `<ResidentProfile resident={resident} planHistory={planHistory} plans={plans} />`.

  **`components/residents/ResidentProfile.tsx`** (Client Component):

  Header section:
  - Avatar circle with initials (no photo upload yet).
  - Name (large), Room/Bed, Plan name, Status badge.
  - Action buttons (shown based on status):
    - "Change Plan" button (opens dialog) — always shown for active/notice.
    - "Give Notice" button — shown only when `status === 'active'`.
    - "Check-out" button (link to `/residents/[id]/checkout`) — shown when `status === 'notice'` or `status === 'active'`.

  Tabs (shadcn `Tabs`):
  1. **Overview** — personal details grid: Name, Mobile, Alt. Mobile, Guardian Name, Guardian Mobile, ID Proof Type, ID Proof Number, Notes. Joining date, Leaving date (if left). Edit details placeholder ("Edit coming soon").
  2. **Plan History** — table: Plan name, Effective From, Effective To (or "Current"). Shows sorted by date descending.
  3. **Rent** — placeholder: "Rent records — Phase 4 coming soon."
  4. **Payments** — placeholder: "Payment history — Phase 4 coming soon."
  5. **Electricity** — placeholder: "Electricity shares — Phase 6 coming soon."
  6. **Deposit** — placeholder: "Deposit details — Phase 5 coming soon."

  **Change Plan Dialog**: Select new plan from active plans dropdown, date picker for `effectiveFrom`. Submit calls `givePlanChange(residentId, newPlanId, effectiveFrom)`. On success: `router.refresh()`.

  **Give Notice Dialog**: Date picker for `noticeDate` (default today). Shows computed `expectedLeavingDate` = noticeDate + noticePeriodDays (read from resident.noticePeriodDays on settings — pass settings.noticePeriodDays as a prop from the server component). Submit calls `giveNotice(residentId, noticeDate)`. On success: `router.refresh()`.

  Files: `app/(dashboard)/residents/[id]/page.tsx`, `components/residents/ResidentProfile.tsx`

  Verify: `npm run build`. After adding a resident, `/residents/[id]` loads and tabs render.

---

- [ ] 14. **Build checkout placeholder: `app/(dashboard)/residents/[id]/checkout/page.tsx`**

  This is Phase 7 functionality — implement a clear placeholder that doesn't break routing.

  ```tsx
  import { notFound } from 'next/navigation';
  import { getResident } from '@/lib/services/residents';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent } from '@/components/ui/card';
  import Link from 'next/link';

  export default async function CheckoutPage({ params }: { params: { id: string } }) {
    const resident = await getResident(params.id);
    if (!resident) notFound();
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-out: {resident.name}</h1>
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <p className="text-gray-500 mb-4">Check-out wizard — Phase 7 coming soon.</p>
            <Link href={`/residents/${params.id}`}>
              <Button variant="outline">← Back to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  ```

  Files: `app/(dashboard)/residents/[id]/checkout/page.tsx`

  Verify: `npm run build`. `/residents/[id]/checkout` returns 200.

---

- [ ] 15. **Update placeholder pages for rent, payments, deposits, electricity, expenses, reports**

  These pages exist but need a consistent, useful placeholder that won't confuse the owner. Replace the bare "coming soon" text with a proper layout that includes the page title, a brief description, and a visual "under construction" card.

  Pattern for each:
  ```tsx
  import { Card, CardContent } from '@/components/ui/card';
  import { [Icon] } from 'lucide-react';

  export default function [Page]Page() {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">[Title]</h1>
          <p className="text-gray-500 mt-1">[Description]</p>
        </div>
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[color]-50 rounded-2xl flex items-center justify-center mb-4">
              <[Icon] className="w-8 h-8 text-[color]-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase [N]</h3>
            <p className="text-sm text-gray-500 max-w-xs">[what this page will do]</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  ```

  Apply to these files with the given icon/color/description:
  - `app/(dashboard)/rent/page.tsx` — Receipt, yellow, Phase 4, "Generate monthly rent, track payments and pending dues."
  - `app/(dashboard)/payments/page.tsx` — CreditCard, blue, Phase 4, "Complete payment ledger with reversal support and PDF receipts."
  - `app/(dashboard)/deposits/page.tsx` — Wallet, purple, Phase 5, "Track security deposits, refund eligibility, and deductions."
  - `app/(dashboard)/electricity/page.tsx` — Zap, orange, Phase 6, "Enter meter readings, split bills among residents, and collect dues."
  - `app/(dashboard)/expenses/page.tsx` — ShoppingCart, red, Phase 8, "Track PG expenses by category with monthly summaries."
  - `app/(dashboard)/reports/page.tsx` — BarChart2, green, Phase 8, "Income vs expense reports, rent collection, occupancy, and more."

  Files: all 6 placeholder page files listed above.

  Verify: `npm run build`. All 6 pages return 200 and render a card.

---

## Key Gotchas

1. **Route group paths**: `(dashboard)` is NOT in the URL. `revalidatePath('/rooms')` is correct; `revalidatePath('/dashboard/rooms')` would silently fail to invalidate.

2. **`params` is async in Next.js 16**: In dynamic route pages, `params` must be awaited: `const { id } = await params;` — not destructured directly. Apply this in `app/(dashboard)/residents/[id]/page.tsx` and `app/(dashboard)/residents/[id]/checkout/page.tsx`.

3. **Server Action session variable naming**: In `checkin.ts`, the auth session is `const session = await auth()` and the mongoose transaction session is also commonly called `session`. Rename the mongoose one to `mongoSession` throughout to avoid shadowing.

4. **Mongoose `.lean()` returns plain objects**: The `_id` field is a `Types.ObjectId`; call `.toString()` before sending to client. When passing data from Server Components to Client Components, serialize with `JSON.parse(JSON.stringify(data))` or map to plain objects to avoid "only plain objects can be passed" errors.

5. **`'use server'` directive**: Must be the first line (before any imports) in service files. Already correct in `lib/services/settings.ts` — follow that exactly.

6. **No existing Payment model import in checkin.ts**: The `Payment` model exists in `models/Payment.ts` but the receipt generation is Phase 4. In checkin.ts, skip payment creation — just create Deposit and RentRecord. Add a `// TODO Phase 4: create Payment for first rent` comment.

7. **Bed label generation**: Use `'ABCDEFGHIJ'.split('')` to get labels A through J for up to 10 beds. So bed index 0 = 'A', index 1 = 'B', etc.

8. **Filter URL params in residents list**: Use `useSearchParams()` hook which requires the component to be wrapped in `<Suspense>` if the page uses static rendering. Since the residents page fetches data, it's dynamic anyway — but to be safe, wrap `<ResidentsList>` in a `<Suspense fallback={<Skeleton />}>` in the page component.

9. **`router.refresh()` vs `revalidatePath`**: Server Actions call `revalidatePath` to invalidate the cache server-side. Client Components call `router.refresh()` after the action resolves to trigger a re-fetch. Both are needed: `revalidatePath` in the service, `router.refresh()` in the component's success handler.

10. **Mongoose transaction support**: Atlas free tier supports transactions on replica sets. If the connection is a standalone (unlikely with Atlas), transactions will fail. The `connectDB()` utility connects to Atlas URI from `.env.local`; transactions should work as-is.
