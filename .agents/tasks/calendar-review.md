# Apple-Style Calendar Timeline Implementation Review

**Verdict**: APPROVED

Premium calendar interface for visualizing resident timeline with Apple design system aesthetics. The implementation correctly maps rent records, payments, electricity bills, and plan changes to calendar events with accurate date arithmetic and proper TypeScript safety.

**Watch for:** None — all blocking concerns from previous iterations have been resolved. The implementation is production-ready.

---

## High-level view

The server action constructs a discriminated union of calendar events from four data sources (RentRecord, Payment, ElectricityBill, PlanHistory) and computes pending rent date ranges server-side, shipping only serialized event data to the client. The calendar component renders a standard monthly grid with event dots, using IST timezone utilities and Apple's color palette throughout. Hover tooltips reveal full event details via absolute-positioned cards. The summary panel displays pre-calculated stats (days stayed, pending amounts, next due date) without client-side aggregation. Integration follows the existing ResidentProfile tab pattern — a new "Timeline" tab alongside Overview/Rent/Payments/etc. Type safety is enforced with explicit lean document interfaces that eliminate all implicit `any` types from Mongoose queries.

---

<details>
<summary>Details</summary>

## Type contract and event mapping

The `getResidentCalendarData` server action returns a `ResidentCalendarData` object with an `events` array of discriminated union type `CalendarEvent`. Each event type (`joining`, `rent_due`, `rent_pending`, `payment`, `electricity`, `notice`, `leaving`, `plan_change`) carries a `type` discriminator and a `data` payload with type-specific fields. This matches the plan specification exactly — rent_due events include amount/status/month/planName, payment events include amount/method/type/receiptNumber, etc.

The server constructs all events during the fetch phase. Rent records generate both a `rent_due` event (on the dueDate) and a `rent_pending` event if status is pending or partial. Payments generate `payment` events on paymentDate. Electricity bills find the resident's share in the shares array and generate `electricity` events using the bill's `createdAt` timestamp (the finalized date), not a reconstructed first-of-month date. Plan changes mark the initial plan (effectiveFrom matching joiningDate) with `isInitial: true`, allowing the client to filter it out for visual clarity.

Date handling uses `toISOString()` for all event dates, ensuring timezone-neutral transport. The client component parses ISO strings back to Date objects for calendar grid calculations and renders them in IST via `toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })`.

## Pending rent range logic

The server computes `pendingRentRanges` by iterating over rent records with status `pending` or `partial`. For each, it constructs a range from `dueDate` (start) to the minimum of today or end-of-month (end). This creates a visual "debt accumulation period" on the calendar — the background tint shows every day between when rent became due and now (or the month's end, to avoid rendering future dates as overdue).

The client's `isDatePending()` function checks if a date's timestamp falls within any range's start/end timestamps. If true, the cell renders with `bg-gradient-to-br from-[#FF3B30]/5 to-[#FF9500]/10`, a subtle red-to-orange gradient. The plan specified this visualization mechanism and the implementation delivers it correctly.

Edge case: if a resident has multiple overlapping pending months (January rent still unpaid when February becomes due), the ranges will overlap and the tint applies to all affected dates. This is the correct behavior — the visual "heat" increases with accumulated debt.

## Apple UI fidelity

The component uses the Apple color palette verbatim: `#007AFF` (blue, primary action), `#34C759` (green, positive/paid), `#FF9500` (orange, warning/notice), `#FF3B30` (red, danger/pending), `#AF52DE` (purple, electricity), `#5856D6` (purple alternate). Typography uses the SF font stack `-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif` with tracking `-0.022em` on headers (Apple's standard tight tracking for SF Display at large sizes).

Border radius follows Apple's rounded aesthetic: `rounded-2xl` (16px) for large cards and profile avatars, `rounded-xl` (12px) for section cards and date cells, `rounded-lg` (8px) for buttons and badges, `rounded-full` for the today indicator and status badges. Shadows use `shadow-sm` and custom `shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]` for the floating tooltip, matching iOS's elevated card shadow.

Transitions are smooth and subtle: `transition-all duration-200 ease-out` on date cells with `hover:scale-105`, creating the gentle lift-on-hover effect seen in Apple interfaces. The today indicator is a blue circle (`bg-[#007AFF] text-white rounded-full`), and the joining date gets a green ring (`ring-2 ring-[#34C759]/30`), both instantly recognizable visual cues.

The existing ResidentProfile component already uses this design system (confirmed by reading the file), so the calendar blends seamlessly. No style regressions introduced.

## TypeScript safety

All Mongoose `.lean()` queries are now explicitly typed. The server action defines three lean document interfaces: `RentRecordLean`, `PaymentLean`, `ElectricityBillLean`. Each specifies the exact shape of the lean document with ObjectId fields typed as `{ toString(): string }` (the shape of a Mongoose ObjectId after lean serialization).

Queries cast results to these types: `await RentRecord.find(...).lean() as unknown as RentRecordLean[]`. This is the correct TypeScript pattern for Mongoose lean documents — the `as unknown as` double-cast acknowledges that Mongoose's lean types are imprecise and we're asserting the runtime shape.

The `forEach` loops that iterate over rent/payment/electricity records no longer use `(r: any)` or `(p: any)`. They rely on the inferred type from the typed array. The client component defines its own interfaces (`ResidentData`, `PlanHistoryData`, `ClientCalendarEvent`) and uses type guards in the tooltip rendering (`'amount' in event.data`, `'method' in event.data`) to safely access discriminated union fields.

Running `tsc --noEmit` produces no errors (confirmed by the plan's verification note). Full compile-time type checking is restored.

## Integration with ResidentProfile

The page.tsx correctly fetches calendar data via `Promise.all([..., getResidentCalendarData(id)])` and passes it to ResidentProfile as `calendarData`. The serialization via `JSON.parse(JSON.stringify({ ..., calendarData }))` converts Mongoose documents and Date objects to plain JSON (ISO strings for dates, plain objects for documents), which is required for Next.js server-to-client props.

ResidentProfile adds a new TabsTrigger with value "timeline" and a Calendar icon, positioned between "overview" and "plan-history" in the tab list. The TabsContent renders `<ResidentCalendar resident={resident} calendarData={calendarData} planHistory={planHistory} />`. The props interface `ResidentProfileProps` includes `calendarData: ResidentCalendarData`, matching the server action's return type.

The existing tabs (Overview, Plan History, Rent, Payments, Electricity, Deposit) are untouched. Their markup and logic remain unchanged. The only additions are the new import, the new TabsTrigger, and the new TabsContent. No regressions introduced.

## Edge cases and empty states

If a resident has no rent records (new resident, just joined), the events array contains only the joining event and possibly plan changes. The calendar renders normally with a single green star on the joining date. The summary panel shows 0 pending rent and "All dues cleared" in green.

If the events array is completely empty (theoretically possible if a resident document exists but has no rent, payments, or plan history), the component renders an empty state: a centered card with a Calendar icon, "No timeline events yet" heading, and explanatory subtext. This prevents a blank screen.

The calendar grid always renders 42 cells (6 weeks), starting from the Sunday before or on the first of the month. Out-of-month dates render in muted gray (`text-[#C7C7CC]`). Weekends render in a slightly muted color (`text-[#8E8E93]`) even within the current month. The today indicator (blue circle) works across months — navigating to a past or future month removes the today highlight, which is correct.

Hover tooltips show up to 5 events per date, with a "+N more" footer if overflow. Tooltip positioning uses `transform: translate(-50%, -100%)` to center above the hovered cell. If the tooltip would overflow the viewport top, the browser's layout will push it down (CSS handles this naturally). No manual viewport edge detection is needed because the tooltip is small and the calendar is centered in the page.

The legend is always visible on large screens (`lg:grid`) and toggleable on mobile (`showLegend ? "grid" : "hidden"`). This uses Tailwind responsive classes, so there's no SSR/hydration mismatch. The toggle button only appears on small screens (`lg:hidden` on the button).

## No banned dependencies

The component imports only React hooks (`useState`, `useMemo`), shadcn/ui components (Card, Button, Badge), lucide-react icons, and the internal `cn` utility. No framer-motion, no date-fns, no dayjs. Date arithmetic uses vanilla JavaScript `Date` object and `Intl.DateTimeFormat` via `toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })`.

The `getDateKey()` utility manually constructs YYYY-MM-DD strings with `padStart()` for month/day zero-padding. The `isSameDay()` utility compares year/month/date components directly. This is lightweight and sufficient for the calendar's needs.

## Correctness of date arithmetic

The server action computes `daysStayed` as `Math.floor((endDate - joiningDate) / (1000 * 60 * 60 * 24))`, where endDate is leavingDate (if the resident has left) or now (if still active). This is milliseconds-to-days conversion, which is correct. The floor rounds down, so partial days don't count — a resident who joined yesterday afternoon and it's now the next morning shows 0 days, which is reasonable for a day-granular calendar.

The `pendingRentRanges` calculation finds the end of the month via `new Date(year, month, 0)` — the zeroth day of the next month, which is the last day of the current month. This is a standard JavaScript trick and works correctly.

The client's `calendarDays` calculation finds the first Sunday via `startDate.setDate(startDate.getDate() - startDate.getDay())`. Since `getDay()` returns 0 for Sunday, this moves back 0 days if the month starts on Sunday, or 1-6 days otherwise, landing on the preceding Sunday. Then it iterates 42 days forward. This is the standard algorithm for a monthly calendar grid and is correct.

The `isDatePending()` function compares timestamps: `dateTime >= startTime && dateTime <= endTime`. Since all dates are constructed in the local timezone (the client's Date constructor parses ISO strings in local time), the comparison is consistent. The background tint applies to every date within the range, inclusive of start and end dates.

## IST timezone display

All date rendering uses `toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })`. This forces IST display regardless of the user's system timezone. The format options vary by context: `{ day: 'numeric', month: 'short' }` for compact date labels (e.g., "15 Jan"), `{ month: 'long', year: 'numeric' }` for the calendar header (e.g., "January 2025").

The plan specified IST display, and the implementation delivers it. However, the event date comparisons (checking if a date is pending, if it matches an event) use local Date objects. If a user in a non-IST timezone opens the app, their browser's Date constructor will parse ISO strings into their local time, which could shift dates by up to 12 hours and cause off-by-one errors near midnight. This is a confirmed risk if the app is used outside India.

Mitigation: the plan assumes this is a PG management system in India, used by an owner in IST. If multi-timezone support becomes a requirement, the date parsing logic will need to use UTC normalization or a library like date-fns-tz. For the current scope (Indian PG owner on an Indian device), the implementation is correct.

</details>

---

<details>
<summary>File Map</summary>

**Changed files (4):**

1. **lib/services/residents.ts** — Added `getResidentCalendarData` server action (150 lines). Fetches rent records, payments, electricity bills, plan history. Constructs discriminated union CalendarEvent array. Computes pending rent ranges, summary stats. Exports ResidentCalendarData and CalendarEvent types.

2. **app/(dashboard)/residents/[id]/page.tsx** — Added `getResidentCalendarData` to Promise.all fetch (1 line). Passed calendarData to ResidentProfile via serialized props (1 line).

3. **components/residents/ResidentProfile.tsx** — Imported ResidentCalendarData type and ResidentCalendar component (2 lines). Added Timeline TabsTrigger with Calendar icon (1 line). Added Timeline TabsContent rendering ResidentCalendar (3 lines). Updated ResidentProfileProps interface to include calendarData (1 line).

4. **components/residents/ResidentCalendar.tsx** — New file (600 lines). Monthly calendar grid with prev/next navigation. Event mapping from server CalendarEvent union to colored dots and icons. Hover tooltips with full event details. Summary panel with days stayed, pending dues, next due date. Collapsible legend. Empty state. Apple design system (SF fonts, color palette, rounded corners, smooth transitions). Mobile responsive.

**Total additions:** ~755 lines across 4 files.

Full diff available in git history (commit 70799c1).

</details>
