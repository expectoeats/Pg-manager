<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

1. Project Overview  
  
A web app for a PG (paying guest) owner to replace the paper register. Owner-only panel in v1, mobile-first (the owner will mostly use a phone).  
  
Goals  
  
Track rooms, beds and residents  
Manage flexible plans (room + food combinations)  
Generate monthly rent automatically and record payments  
Track the security deposit and refund rules  
Calculate electricity bills and split them among residents  
Handle check-out and final settlement  
Show pending dues and monthly income/expense reports  
  
Out of scope for v1: resident login, online payments, WhatsApp integration, multi-PG support.  
  
2. Tech Stack  
Part	Choice  
Framework	Next.js 14 (App Router, TypeScript)  
UI	Tailwind CSS + shadcn/ui  
Database	MongoDB Atlas + Mongoose  
Auth	Auth.js (Credentials), bcrypt-hashed password  
Forms/validation	react-hook-form + zod  
Data mutations	Server Actions (or API routes)  
PDF	@react-pdf/renderer or pdf-lib (receipts)  
Export	xlsx for Excel export  
Charts	recharts  
Deploy	Vercel  
  
Conventions  
  
All money values are stored as integers in rupees (no decimals).  
All dates stored in UTC, displayed in IST (Asia/Kolkata).  
Never hard-delete financial records. Use status flags or reversal entries.  
Every create/update on money-related data writes an ActivityLog entry.  
3. Roles  
Owner (admin): full access. Single account in v1.  
Staff (optional, later): can record payments and meter readings, cannot delete/edit settings or view reports.  
4. Data Models (Mongoose)  
User  
  
name, email, passwordHash, role (owner|staff), createdAt  
  
Room  
roomNumber (unique, string)  
sharingType (double | triple)  
totalBeds (number)  
floor (optional)  
isActive (boolean)  
hasSubMeter (boolean) for electricity billing  
Bed  
room (ref Room)  
bedLabel (e.g. "A", "B", "C")  
status (vacant | occupied)  
currentResident (ref Resident, nullable)  
Plan (owner-configurable, never hard-code prices)  
name (e.g. "Triple Sharing, Room Only")  
type (room | room_food | food_only)  
sharingType (double | triple | none)  
includesBreakfast, includesLunch, includesDinner (booleans)  
price (monthly, integer)  
isActive  
  
Seed plans (editable by owner):  
  
Triple sharing room only: 4500  
Double sharing room only: 5000  
Room + all meals: 7000  
Breakfast only: 1500  
Dinner only: 2000  
Breakfast + weekend lunch: 2000  
Monthly food-only (canteen): 2600  
Resident  
name, mobile, alternateMobile, photoUrl  
idProofType, idProofNumber, idProofFileUrl  
guardianName, guardianMobile  
room (ref), bed (ref)  
currentPlan (ref Plan)  
joiningDate  
status (active | notice | left)  
noticeDate (nullable)  
expectedLeavingDate (nullable)  
leavingDate (nullable)  
notes  
PlanHistory  
  
Tracks plan changes: resident, plan, effectiveFrom, effectiveTo.  
  
Deposit  
resident (ref)  
amount (default 2000)  
status (pending | held | refunded | forfeited | adjusted)  
receivedDate  
refundDate, refundAmount  
deductions: [{ reason, amount }]  
refundEligible (computed, see rules)  
RentRecord (one per resident per billing month)  
resident, month (format YYYY-MM)  
planSnapshot (name + price at generation time)  
amountDue  
amountPaid (derived from payments)  
status (pending | partial | paid)  
dueDate  
adjustments: [{ reason, amount }] (discount/extra charge)  
Payment (immutable)  
resident  
type (rent | deposit | electricity | other)  
rentRecord / electricityShare (ref, optional)  
amount  
method (cash | upi | bank)  
transactionRef (optional)  
paymentDate  
receiptNumber (auto-increment, e.g. RCPT-0001)  
isReversal (boolean) and reversalOf (ref Payment, nullable)  
note  
createdBy (ref User)  
ElectricityBill (per room per month)  
room, month  
previousReading, currentReading  
unitsConsumed (computed)  
ratePerUnit  
totalAmount (computed)  
shares: [{ resident, daysStayed, amount, amountPaid, status }]  
status (draft | finalized)  
Expense  
  
category (grocery|cleaning|repair|wifi|electricity|water|salary|other), amount, date, note, createdBy  
  
ActivityLog  
  
user, action, entityType, entityId, summary, timestamp  
  
Settings  
  
pgName, address, phone, depositAmount (2000), noticePeriodDays (20), rentDueDay (1), defaultRatePerUnit, billingMode (calendar|joining_cycle), receiptFooter  
  
5. Business Rules (Core Logic)  
5.1 Check-in  
Owner selects a vacant bed and a plan, then enters resident details.  
Create Resident (status = active), mark Bed occupied.  
Create Deposit (amount = Settings.depositAmount, status = pending). Owner records receipt, then status = held.  
Generate the first RentRecord (see 5.2).  
5.2 Rent generation  
Rent is generated monthly for every resident with status in (active, notice).  
Trigger: Vercel Cron on the 1st of each month plus a manual "Generate this month's rent" button. Generation must be idempotent (unique index on resident + month).  
amountDue = price of the resident's plan effective for that month.  
First month: owner-configurable via Settings.billingMode:  
calendar: full or prorated by days remaining (add a toggle "prorate first month").  
joining_cycle: the due date repeats on the joining day every month.  
Resident's currentPlan price changes only apply from the effectiveFrom date of a plan change.  
5.3 Payments  
A payment can be partial. Allocate it to the oldest pending RentRecord first (FIFO) unless the owner picks one.  
RentRecord.status: paid if amountPaid >= amountDue, partial if 0 < amountPaid < amountDue, else pending.  
Overpayment is stored as advance credit on the resident and auto-applied to the next RentRecord.  
No edit or delete. To correct a mistake, create a reversal Payment (isReversal = true, negative effect) and then a new correct Payment.  
Every Payment generates a downloadable PDF receipt.  
5.4 Electricity billing  
Owner picks the month and room, enters the current reading (previous reading auto-filled from last month).  
unitsConsumed = current - previous (must be >= 0, otherwise show an error).  
totalAmount = unitsConsumed * ratePerUnit.  
Split among residents of that room:  
Equal split by default.  
Option: split by days stayed during the month (for mid-month check-ins/outs).  
If a room has no sub-meter, the owner can enter one bill for the whole PG and choose: split equally among all residents.  
Bill is draft until finalized. Once finalized, shares become payable and show on the resident's dues.  
5.5 Notice and check-out  
When a resident gives notice, set noticeDate, status = notice, and compute expectedLeavingDate.  
Notice period requirement = Settings.noticePeriodDays (default 20).  
noticeGivenInTime = (leavingDate - noticeDate) >= noticePeriodDays  
5.6 Deposit refund rule  
  
Deposit is refundable only if both are true:  
  
noticeGivenInTime === true  
All electricity dues of the resident are cleared  
  
Otherwise the deposit is forfeited (or adjusted against dues). The owner can override with a reason, which gets logged.  
  
refundAmount = depositAmount - sum(deductions) - pendingElectricity - pendingRent(optional, owner toggle)  
if (!noticeGivenInTime || electricityPending > 0 && !adjustAgainstDeposit) => not eligible (show reason)  
5.7 Final settlement (check-out wizard)  
  
Steps:  
  
Enter the leaving date.  
System checks notice period.  
Show pending rent, pending electricity, and the final electricity share.  
Deposit calculation: deductions and net refund (or amount payable by the resident).  
Record the refund (cash/UPI) and mark Deposit refunded.  
Mark Resident left, free the Bed (vacant), stop future rent generation.  
Generate a Final Settlement PDF.  
6. Pages and Layout  
Global layout  
Desktop: left sidebar + top bar + content area.  
Mobile: top bar with a hamburger + bottom navigation (Dashboard, Residents, Rent, More).  
Top bar: PG name, search (resident name/mobile/room), notifications bell, profile menu.  
Use shadcn Card, Table, Dialog, Sheet, Tabs, Badge, Select, Toast.  
Status colors: green = paid/vacant, yellow = partial/notice, red = pending/overdue, gray = left.  
Route map  
/login  
/(dashboard)/dashboard  
/(dashboard)/residents  
/(dashboard)/residents/new  
/(dashboard)/residents/[id]  
/(dashboard)/residents/[id]/checkout  
/(dashboard)/rooms  
/(dashboard)/plans  
/(dashboard)/rent  
/(dashboard)/rent/[month]  
/(dashboard)/payments  
/(dashboard)/deposits  
/(dashboard)/electricity  
/(dashboard)/electricity/new  
/(dashboard)/expenses  
/(dashboard)/reports  
/(dashboard)/settings  
/(dashboard)/activity-log  
6.1 Login (/login)  
  
Centered card: email, password, "Login" button. Redirect to /dashboard. All other routes are protected by middleware.ts.  
  
6.2 Dashboard (/dashboard)  
Top stat cards: Total residents, Occupied/Vacant beds, Rent collected this month, Pending rent, Pending electricity, Pending deposit refunds.  
Quick actions: Add Resident, Record Payment, Add Meter Reading, Generate Rent.  
Sections:  
Residents with pending rent (top 10, with a "Collect" button)  
Upcoming check-outs (on notice)  
Recent payments  
Food plan-wise resident count (small chart)  
Income vs expenses this month (bar chart)  
6.3 Residents list (/residents)  
Search + filters: status (active/notice/left), plan, room, rent status.  
Table columns: Name, Mobile, Room/Bed, Plan, Joining date, Rent status badge, Actions.  
"Add Resident" button. Mobile view uses cards instead of a table.  
6.4 Add/Edit resident (/residents/new)  
  
Multi-section form:  
  
Personal: name, mobile, guardian, photo  
ID proof: type, number, upload  
Stay: room, bed (only vacant beds shown), plan, joining date  
Deposit: amount (prefilled), "Received now?" toggle with method  
First rent: preview of the amount due, with an optional "Record first payment" toggle  
  
On submit: runs the check-in logic (5.1) in a single transaction.  
  
6.5 Resident profile (/residents/[id])  
  
Header: photo, name, room/bed, plan, status badge, action buttons (Record payment, Change plan, Give notice, Check-out). Tabs:  
  
Overview: details, ID proof, guardian  
Rent: month-wise table (due, paid, status) and total pending  
Payments: full history with receipt download  
Electricity: month-wise shares  
Deposit: status, deductions, refund eligibility with reasons  
Plan history: plan changes with effective dates  
6.6 Check-out wizard (/residents/[id]/checkout)  
  
Stepper per 5.7: Leaving date → Notice check → Dues summary → Deposit settlement → Confirm. Show the eligibility reasoning clearly, e.g. "Notice given only 12 days before leaving (20 required)".  
  
6.7 Rooms and beds (/rooms)  
Grid of room cards: room number, sharing type, a bed icon row (green = vacant, red = occupied, with the resident's name on hover/tap).  
Add/Edit room dialog. Adding a room auto-creates beds equal to totalBeds.  
Filters: vacant only, sharing type.  
6.8 Plans (/plans)  
Table of plans: name, type, meals included, price, active toggle.  
Add/Edit plan dialog. Deactivating a plan does not affect existing residents.  
Changing a plan price only affects future rent records.  
6.9 Rent (/rent, /rent/[month])  
Month selector at the top. Summary cards: total due, collected, pending.  
Table: resident, room, plan, due, paid, balance, status, "Collect" button.  
Button: "Generate rent for this month" (idempotent).  
Filters: pending / partial / paid.  
"Collect" opens a payment dialog (amount, method, date, reference, note) and generates a receipt.  
6.10 Payments (/payments)  
  
Complete ledger: date, resident, type, amount, method, receipt no., reversal badge. Date filters and Excel export. A "Reverse" action creates a correction entry and requires a reason.  
  
6.11 Deposits (/deposits)  
  
Tabs: Held, Pending, Refund due (on notice), Refunded. Each row shows the amount, resident, and refund eligibility status.  
  
6.12 Electricity (/electricity, /electricity/new)  
List by month with room-wise bills.  
New bill form: month, room, previous reading (auto), current reading, rate (default from settings), split method (equal/days).  
Live preview of the per-resident share before saving.  
Finalize button to create resident shares. Paid/pending per share, with a "Collect" button.  
6.13 Expenses (/expenses)  
  
Add expense (category, amount, date, note). Table with date and category filters and monthly totals.  
  
6.14 Reports (/reports)  
Monthly income vs expense vs profit  
Rent collection report (by plan)  
Pending dues report (rent + electricity)  
Deposit liability report (total held)  
Occupancy report  
Export: Excel and PDF  
6.15 Settings (/settings)  
  
PG details, deposit amount, notice days, default per-unit rate, billing mode, receipt footer, password change, data backup/export button.  
  
6.16 Activity log (/activity-log)  
  
Read-only table: who did what and when, filterable by entity.  
  
7. Key User Flows  
  
Flow A: New resident joins Residents → Add Resident → pick vacant bed + plan → record deposit → first rent record created → receipt.  
  
Flow B: Monthly rent cycle 1st of month: cron generates rent → owner opens Rent page → collects payments (cash/UPI) → receipts → pending list shrinks.  
  
Flow C: Monthly electricity Electricity → New → select room → enter reading → preview split → finalize → shares appear in resident dues → collect.  
  
Flow D: Resident leaves Resident profile → Give notice (date saved) → on leaving day: Check-out wizard → dues + deposit calculation → refund → bed freed → settlement PDF.  
  
Flow E: Mistaken payment Payments → Reverse (reason) → record a correct payment. Both appear in the ledger and the activity log.  
  
8. Validation and Edge Cases  
A bed can hold only one active resident. Prevent double allocation.  
Meter currentReading >= previousReading.  
Cannot check out while an unresolved final settlement exists.  
Duplicate rent generation is prevented by the resident + month unique index.  
A resident on notice still gets rent until the leaving date.  
Rooms with active residents cannot be deleted. Deactivate only.  
Resident plan change: needs effectiveFrom, and future RentRecords use the new price. Past records are unchanged.  
Mobile number must be a valid 10-digit Indian number.  
Use MongoDB transactions for check-in, payment allocation and check-out.  
9. Folder Structure  
app/  
  (auth)/login/page.tsx  
  (dashboard)/  
    layout.tsx  
    dashboard/page.tsx  
    residents/ (page, new, [id], [id]/checkout)  
    rooms/ plans/ rent/ payments/ deposits/  
    electricity/ expenses/ reports/ settings/ activity-log/  
  api/cron/generate-rent/route.ts  
  api/receipts/[id]/route.ts  
components/ (ui/, layout/, forms/, tables/, charts/)  
models/ (User, Room, Bed, Plan, Resident, PlanHistory, Deposit,  
         RentRecord, Payment, ElectricityBill, Expense,  
         ActivityLog, Settings)  
lib/ (db.ts, auth.ts, validators/, services/, utils/)  
lib/services/ (checkin.ts, rent.ts, payments.ts, electricity.ts,  
               deposit.ts, checkout.ts, reports.ts)  
middleware.ts  
  
Put business logic in lib/services/* (not inside components) so it can be tested and reused.  
  
10. Build Order (give the AI one phase at a time)  
  
Phase 1: Foundation Project setup, MongoDB connection, all Mongoose models, Auth.js login, protected layout (sidebar/bottom nav), Settings page.  
  
Phase 2: Rooms, Beds, Plans CRUD for rooms (auto-create beds) and plans. Seed the default plans.  
  
Phase 3: Residents Add/Edit resident form, list with filters, profile page, plan change with history.  
  
Phase 4: Rent and Payments Rent generation (cron plus manual), rent page, payment dialog, FIFO allocation, advance credit, reversal, receipt PDF.  
  
Phase 5: Deposit Deposit tracking, notice date, eligibility logic.  
  
Phase 6: Electricity Bill creation, split logic, finalize, collect.  
  
Phase 7: Check-out and settlement Wizard plus settlement PDF.  
  
Phase 8: Expenses, Reports, Dashboard Expense CRUD, reports, Excel/PDF export, dashboard widgets, activity log.  
  
Phase 9: Polish Mobile responsiveness, loading/empty/error states, seed demo data, backup export, deploy to Vercel.  
  
11. Prompting Tips for the AI Tool  
Paste only the relevant sections (e.g. Sections 2, 4, 5 and one phase) per prompt, not the entire file.  
Ask it to "implement Phase N exactly as specified, and list any assumptions you made."  
After each phase: run the app, test with dummy data, then move on.  
Ask for service functions + unit tests for rent allocation, electricity split and deposit eligibility. These are the places where bugs cost real money.  
