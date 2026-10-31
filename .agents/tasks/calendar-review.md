# Apple-Style Resident Calendar Implementation Review

**Verdict**: CHANGES_REQUESTED

## Summary

The implementation adds a monthly calendar view to resident profile pages, visualizing timeline events like joining date, rent due dates, payments, electricity bills, notice periods, and plan changes. The calendar uses Apple's design language with SF-style typography, the iOS color palette (#007AFF, #34C759, #FF9500, #FF3B30, #AF52DE), rounded corners, subtle shadows, and smooth transitions. Event dots appear on relevant dates, hover tooltips show details, and a summary panel displays aggregated stats.

**Watch for:** The calendar grid computes its layout correctly, but the legend's mobile toggle won't work (confirmed — reads window.innerWidth at module evaluation time, not runtime). The server action returns raw data arrays instead of the CalendarEvent discriminated union the plan specified, forcing the client to reconstruct events. Electricity bill dates use the first of the month, not the bill's creation timestamp. The pending rent range visualization is missing — only a single-day rent_pending event is created. TypeScript safety is compromised by several `any` type assertions and missing null checks.

---

## High-level view

The server action fetches rent records, payments, and electricity bills and returns them as raw arrays rather than the planned CalendarEvent discriminated union, delegating all event construction logic to the client. The client reconstructs events from this data, mapping each record type to calendar event types. The calendar grid renders 6 weeks (42 days) starting from the Sunday before the first of the month. Each date cell checks a Map built from the event array and renders up to 3 colored dots, with a "+N more" indicator for overflow. Hovering a date triggers a tooltip positioned above the cell. The summary panel computes days stayed, pending amounts, and next due date from the raw data. The legend lists all event types with icons and colors but uses a mobile-first responsive strategy that breaks because it reads window.innerWidth during SSR/build time. The integration passes calendarData from the page server component through ResidentProfile to ResidentCalendar, but the type mismatch between the server's return type and the client's expectations is papered over with JSON serialization. The Apple design aesthetic is applied consistently: rounded-2xl cards, subtle hover scale transforms, SF font stack, iOS color palette, and 2px icon strokes.

---

<details>
<summary>Issues (9)</summary>

1. **Server action returns raw arrays, not CalendarEvent union** — The plan specifies a discriminated union return type with flattened events; the implementation returns three separate arrays (rentRecords, payments, electricityShares) and forces the client to construct events. Change getResidentCalendarData to return { events: CalendarEvent[], pendingRentRanges, ... } as planned. (confirmed)

2. **Pending rent range visualization missing** — The calendar only creates a single rent_pending event on the due date; the plan calls for pendingRentRanges with startDate/endDate so multiple dates can be tinted. Implement the range calculation server-side and check it client-side in isDatePending. (confirmed)

3. **Legend mobile toggle reads window.innerWidth at build time** — The expression `(showLegend || window.innerWidth >= 1024)` in the JSX evaluates window.innerWidth when the module is loaded, which is during SSR or build, not at runtime in the browser. Use CSS media queries (hidden lg:grid) or a client-side useEffect with window resize listener. (confirmed)

4. **Electricity bill date uses first of month, not finalizedAt** — The plan states "Uses the createdAt timestamp of the ElectricityBill document, not the bill's month field," but the client code parses share.month and constructs `new Date(year, month - 1, 1)`. The server sends finalizedAt (using createdAt fallback), but the client ignores it. Use finalizedAt for the event date. (confirmed)

5. **Type safety gaps: `any` in transformations** — residents.ts uses `(r: any)`, `(p: any)`, `(bill: any)`, and `(s: any)` in map/forEach callbacks instead of typing them as the Mongoose lean documents. Add proper types or cast to the Mongoose document type + `& { _id: ObjectId }`. (confirmed)

6. **Missing null check on electricityBill.createdAt** — The fallback `new Date().toISOString()` is used when createdAt is missing, but this should never happen for a finalized bill. Either assert it exists or log a warning. (likely)

7. **Plan change exclusion logic fragile** — The client excludes plan changes where `dateKey !== joiningDateKey`, but this relies on exact date match. If a plan is created with a timestamp a few seconds after joining, it won't match. Use a tolerance window (same calendar day in IST) or server-side flag. (likely)

8. **Tooltip positioning does not handle viewport edges** — The tooltip always transforms `translate(-50%, -100%)` (centered above). Near top of viewport, it clips. Near left/right edges, it clips. Implement bounds checking and flip position. (confirmed)

9. **No TypeScript check on ResidentProfile calendarData prop** — ResidentProfile imports ResidentCalendarData but the prop type doesn't enforce it; the destructured planHistory is typed but calendarData is not explicitly validated. Add explicit type annotation to the interface. (likely)

</details>

---

<details>
<summary>Details</summary>

## Server action design and type contract

The plan specifies that `getResidentCalendarData` should return a discriminated union of CalendarEvent types: joining, rent-due, payment, plan-change, electricity, notice-start, notice-end. Each event has a `type` field and a `date` field (ISO string), plus type-specific fields. The actual implementation returns three raw arrays: `rentRecords`, `payments`, `electricityShares`, plus `rentDueDay`. The client then loops over these arrays and constructs CalendarEvent objects in the `eventsByDate` useMemo hook.

This violates the planned contract in two ways. First, the client is forced to duplicate business logic: deciding which rent records produce which events (rent_due, rent_pending), whether to exclude the first plan change, how to map electricity shares to dates. Second, the type system doesn't enforce the event schema — the server could change rentRecord fields without a compile-time error in the client until runtime crashes occur.

The correct approach is to perform all event construction server-side and return `{ events: CalendarEvent[], pendingRentRanges: ..., totalPendingAmount, nextDueDate, daysStayed, rentDueDay }`. The client then becomes a pure rendering layer: map events to date keys, render dots, show tooltips. This also enables future server-side filtering (e.g., only events in a date range) and reduces client-side bundle size (no need to import date logic).

## Pending rent range calculation

The plan requires `pendingRentRanges: Array<{ startDate: string; endDate: string; month: string }>` to be returned by the server and consumed by the client to tint date cells red/orange for the duration of a pending rent period. The implementation creates a single-point `rent_pending` event on the due date, but does not compute ranges.

The client's `isDatePending` function checks if a date has a `rent_pending` event, which only matches the exact due date. The visual "heat map" effect described in the plan is absent. A resident with rent pending from Jan 5 to Jan 31 should see all 26 cells tinted; currently only Jan 5 is tinted.

To fix: In the server action, for each rent record with status pending or partial, compute `startDate = dueDate` and `endDate = min(today, endOfMonth(dueDate))`. Return this array. In the client, change `isDatePending` to loop over pendingRentRanges and check if the date falls within any range using date arithmetic.

## Calendar grid layout and month navigation

The calendar computes a 42-day grid (6 weeks) starting from the Sunday on or before the first of the month. This logic is correct and matches the plan. The `calendarDays` useMemo correctly sets the starting date, then increments 42 times. The grid renders with `grid-cols-7` and each cell is `aspect-square`, so it's always a square 7x6 grid.

Month navigation buttons call `setCurrentMonth` with a new Date, offsetting the month by ±1. The "Go to today" button resets to `new Date()`. All of this is correct. The month/year header uses `formatMonthYear`, which calls `toLocaleDateString('en-IN')` — this produces month and year in the system locale, but the locale is explicitly set to 'en-IN', so it's deterministic.

## Event mapping and prioritization

The client constructs a `Map<string, CalendarEvent[]>` keyed by YYYY-MM-DD strings. Each event is added to the map via the `addEvent` helper. The map is then queried in the grid render loop.

Event creation logic:
- Joining: single event on joiningDate
- Rent due: one event per RentRecord on dueDate
- Rent pending: one event per pending/partial RentRecord on dueDate (should be a range, not a point)
- Payment: one event per Payment on paymentDate
- Electricity: one event per ElectricityBill share, on the first of the share's month (should use finalizedAt)
- Notice: one event on noticeDate
- Leaving: one event on expectedLeavingDate
- Plan change: one event per PlanHistory entry, excluding entries whose effectiveFrom matches joiningDate by date key

The plan change exclusion logic compares `dateKey !== joiningDateKey`. This works if joiningDate and the first plan's effectiveFrom are the same ISO string. However, if they differ by seconds (e.g., plan created after resident is inserted), the keys won't match and the first plan change will appear as an event. The server should flag the initial plan explicitly (e.g., `isInitial: true` on PlanHistory) or the client should compare calendar days (ignoring time).

The cell render loop slices `events.slice(0, 3)` to show up to 3 dots, then displays "+N more" if there are more. This matches the plan's "maximum visible events" rule. The tooltip renders all events (up to 5, with "+N more" if > 5). This is correct and prevents overflow.

## Apple design fidelity

The component uses:
- Color palette: #007AFF (blue), #34C759 (green), #FF9500 (orange), #FF3B30 (red), #AF52DE (purple), #8E8E93 (gray), #C7C7CC (light gray), #1C1C1E (text), #F2F2F7 (background), #E5E5EA (border), #F9F9FB (hover)
- Typography: `-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif` in the root div style and tooltip
- Border radius: `rounded-2xl` on cards, `rounded-xl` on summary stat boxes, `rounded-lg` on date cells and badges
- Shadows: `shadow-sm` on calendar card, `shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]` on tooltip
- Transitions: `transition-all duration-200 ease-out` on date cells, hover scale `hover:scale-105`
- Icon stroke width: `strokeWidth={2}` on all lucide-react icons

This is consistent with the existing ResidentProfile.tsx, which uses the same color variables, rounded corners, and icon styles. The design is recognizably Apple-inspired and cohesive with the rest of the app.

## Tooltip behavior and positioning

Hovering a date cell calls `handleDateHover`, which sets `hoveredDate` (the date key) and `hoveredPosition` ({ x, y } from the cell's bounding rect). The tooltip renders in a fixed-position div at `{ left: x, top: y - 10, transform: 'translate(-50%, -100%)' }`. This centers the tooltip horizontally and positions it above the cell.

The problem: if the cell is near the top of the viewport (y < tooltip height), the tooltip renders off-screen. If the cell is near the left edge (x < tooltip width / 2), the tooltip's left edge clips. If near the right edge (x > viewport width - tooltip width / 2), the right edge clips.

The plan acknowledges this: "Tooltip positioning near viewport edges (flip position)". The implementation does not handle it. A production-ready solution would check `hoveredPosition.y < tooltipHeight + margin` and flip to below the cell, and check `hoveredPosition.x < tooltipWidth / 2` to align left instead of center.

For the current iteration, this is a non-blocking enhancement, but it should be flagged as missing.

## Legend mobile toggle

The legend section has a "Show/Hide" button visible only on `lg:hidden` (mobile). The button toggles `showLegend` state. The legend grid renders conditionally:

```tsx
{(showLegend || window.innerWidth >= 1024) && ( ... )}
```

This expression reads `window.innerWidth` in the JSX. In a React component, this is evaluated every time the component renders. However, during SSR or static generation (Next.js build), `window` is undefined (or a polyfill that returns a fixed value). Even in the browser, `window.innerWidth` is read once per render but doesn't react to resize events — the expression will always use the initial window width at mount time.

The plan specifies "Collapsible on mobile (show/hide button)" and "Mobile breakpoint: Summary panel stacks below calendar on screens < 768px (Tailwind's md breakpoint)". The correct implementation is to use Tailwind's responsive utilities: `<div className={cn("hidden lg:grid", showLegend && "grid")}`. This keeps the legend hidden on large screens (always visible) and toggles on small screens. Alternatively, use a `useEffect` with a resize listener to update state, but that's overkill when CSS can handle it.

## Summary panel statistics

The summary panel computes:
- `daysStayed`: `(endDate - joiningDate) / (1000 * 60 * 60 * 24)`, where endDate is leavingDate or today. This is correct.
- `totalPendingRent`: sum of (amountDue - amountPaid) for rentRecords with status pending or partial. Correct.
- `totalPendingElectricity`: sum of (amount - amountPaid) for electricityShares with status pending. Correct.
- `nextDueDate`: earliest dueDate among pending/partial rentRecords. Correct.

All of these are derived from the raw data arrays returned by the server. The logic is sound. The only inefficiency is that the server could compute these values and return them directly, avoiding the client-side reduce loops. The plan specifies `totalPendingAmount` and `daysStayed` as server-returned fields, but the implementation computes them client-side. This works, but diverges from the plan.

## Integration with ResidentProfile

ResidentProfile.tsx imports `ResidentCalendarData` from `@/lib/services/residents` and adds it to the props interface:

```tsx
interface ResidentProfileProps {
  resident: ResidentData;
  planHistory: PlanHistoryData[];
  activePlans: PlanData[];
  noticePeriodDays: number;
  calendarData: ResidentCalendarData;
}
```

The page.tsx fetches calendarData with `await getResidentCalendarData(id)` in the Promise.all, then serializes it with `JSON.parse(JSON.stringify({ ... }))`. This is necessary to convert Mongoose lean objects with `_id: ObjectId` to plain JSON with `_id: string`. The serialization step is correct.

ResidentProfile passes `calendarData` and `planHistory` to `<ResidentCalendar>`. The Timeline tab is added with a Calendar icon in the TabsTrigger. The tab integration is clean and doesn't affect existing tabs. All other tabs (Overview, Plan History, Rent, Payments, Electricity, Deposit) are unchanged.

One observation: ResidentProfile imports `ResidentCalendarData` but doesn't re-export it, and ResidentCalendar imports it directly. This is fine, but it means the two components are coupled to the server action's return type. If the server action changes, both files need updates. A shared types file would decouple this, but for a single feature it's acceptable.

## TypeScript safety

The server action (residents.ts) uses several `any` type assertions:

```typescript
rentRecordsRaw.map((r: any) => ({ ... }))
paymentsRaw.map((p: any) => ({ ... }))
electricityBillsRaw.forEach((bill: any) => { ... })
bill.shares.find((s: any) => ...)
```

These exist because Mongoose's `.lean()` returns `LeanDocument<T>`, which has an `_id: ObjectId` instead of `_id: string`, and other fields may be transformed (e.g., Date to Date object). TypeScript doesn't know the exact shape without explicit types.

The correct approach is to either:
1. Import the Mongoose model types and use `LeanDocument<RentRecord>` etc.
2. Define explicit interfaces for the lean document shapes and cast to them
3. Use type guards to narrow the type before mapping

Using `any` bypasses all type checking and allows typos (e.g., `r.amountDoo` instead of `r.amountDue`) to pass at compile time and fail at runtime. This is a blocking concern for production code.

The client component (ResidentCalendar.tsx) is better typed, with explicit interfaces for `ResidentData`, `PlanHistoryData`, `CalendarEvent`, etc. The only `any` is in `data?: any` on CalendarEvent, which is also a type safety gap — it should be a discriminated union based on the `type` field.

## Edge cases and empty states

The empty state check is:

```tsx
if (calendarData.rentRecords.length === 0 && calendarData.payments.length === 0 && calendarData.electricityShares.length === 0) {
  return <Card>...</Card>;
}
```

This correctly shows the empty state for new residents with no financial data. However, it doesn't check `planHistory.length`, so a resident with plan changes but no rent/payments/electricity will see the full calendar with only joining and plan change events. This is fine — plan changes are legitimate timeline events.

The calendar renders months before the joining date (e.g., if the resident joined in March, navigating to February shows an empty grid). This is correct per the plan: "Handle months before joining date (no events, but show calendar)".

Residents who have left (status='left') use `leavingDate` instead of `today` for the `daysStayed` calculation. This is correct.

The tooltip handles dates with many events by showing up to 5 and a "+N more" line. This prevents overflow and is correct.

## No banned dependencies

The component imports from:
- `react` (useState, useMemo)
- `@/components/ui/*` (shadcn components)
- `lucide-react` (icons)
- `@/lib/utils` (cn helper)
- `@/lib/services/residents` (type)

No date libraries (date-fns, dayjs, moment), no animation libraries (framer-motion), no external calendar libraries. All date arithmetic uses vanilla `Date` object and `toLocaleDateString` with explicit locale and timezone. This matches the plan's "No external date library" constraint.

## Performance considerations

The `eventsByDate` Map is built in a useMemo with dependencies on `[resident, calendarData, planHistory]`. This is correct — the map only rebuilds when data changes. The `calendarDays` array is also memoized with `[currentMonth]`, so it only recalculates when the user navigates months. The `summaryStats` is memoized with `[resident, calendarData]`.

The grid renders 42 cells, each of which queries the `eventsByDate` map once (O(1) lookup). This is efficient. The hover handler sets state, which triggers a re-render, but only the tooltip div changes (React diffing is fast here).

No performance concerns for typical data volumes (hundreds of rent records, payments, etc.). For residents with years of history, the initial event map construction could take a few milliseconds, but this is negligible and only happens once per data fetch.

## Correctness of date arithmetic

The `getDateKey` function constructs YYYY-MM-DD strings with zero-padded month and day. This is correct and matches ISO 8601.

The `isSameDay` function compares year, month, and date. This is correct and timezone-safe (it compares the local date components, which are derived from the Date object's timezone).

The `formatDateIST` function uses `toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })`. This ensures all displayed dates are in IST, regardless of the server's timezone. Correct.

The calendar grid start date is computed by finding the Sunday before or on the first of the month:

```typescript
const startDate = new Date(firstDayOfMonth);
startDate.setDate(startDate.getDate() - startDate.getDay());
```

If the first of the month is a Sunday, `getDay()` returns 0, so the start date is the first itself. If it's a Monday, `getDay()` returns 1, so the start date is one day earlier (the previous Sunday). This is correct.

## Missing features from the plan

The plan specifies several features that are partially or not implemented:

1. **Pending Rent Range Visualization**: Plan calls for date ranges with start/end, implementation only creates single-point events. (blocking)
2. **Electricity Date from finalizedAt**: Plan says use createdAt timestamp, implementation uses first of month. (blocking)
3. **Server-side event flattening**: Plan says return CalendarEvent union, implementation returns raw arrays. (blocking)
4. **Tooltip positioning flip**: Plan mentions "flip position" near edges, not implemented. (non-blocking, enhancement)
5. **Server-computed summary stats**: Plan says server returns totalPendingAmount and daysStayed, implementation computes client-side. (non-blocking, works but diverges from plan)

## Regressions and existing tab impact

No changes to the Overview, Plan History, Rent, Payments, Electricity, or Deposit tabs. The Timeline tab is added as a new TabsTrigger and TabsContent. The TabsList is set to `flex-wrap`, so it wraps on small screens. No regressions.

The header card, action buttons, and notice alert are untouched. The only change to ResidentProfile.tsx is adding the Timeline tab and importing ResidentCalendar. No functional changes to existing features.

</details>

---

## Blocking Issues

1. **Server action returns raw arrays instead of CalendarEvent union** — The type contract specified in the plan is not implemented. The client is forced to duplicate event construction logic. Refactor `getResidentCalendarData` to return `{ events: CalendarEvent[], pendingRentRanges, totalPendingAmount, nextDueDate, daysStayed, rentDueDay }` with a proper discriminated union. (confirmed)

2. **Pending rent range calculation missing** — The "heat map" visualization of pending rent periods is absent. Only the due date is marked, not the range from due date to today. Implement `pendingRentRanges` server-side and modify `isDatePending` client-side to check ranges. (confirmed)

3. **Electricity bill date uses first of month, not finalizedAt** — The plan explicitly states to use the createdAt timestamp (via finalizedAt in the server response). The client ignores this field and reconstructs a date from the month string. Use `finalizedAt` directly. (confirmed)

4. **Type safety: `any` assertions in server action** — Multiple `map` and `forEach` callbacks use `any` types, bypassing compile-time checks. Add explicit types or cast to Mongoose lean document shapes. (confirmed)

5. **Legend mobile toggle broken** — The expression `(showLegend || window.innerWidth >= 1024)` reads `window.innerWidth` at evaluation time, which is SSR or mount time, not on resize. Use Tailwind responsive classes or a useEffect with resize listener. (confirmed)

## Non-Blocking Suggestions

6. **Tooltip positioning near viewport edges** — The tooltip always centers above the cell and can clip near top/left/right edges. Add bounds checking and flip logic. (confirmed)

7. **Plan change exclusion logic fragile** — Relies on exact date key match between joiningDate and effectiveFrom. If timestamps differ by seconds, the first plan change will appear as an event. Use server-side flag or calendar-day comparison in IST. (likely)

8. **Missing null check on electricityBill.createdAt** — The fallback to `new Date()` should never occur for finalized bills. Add an assertion or warning. (likely)

9. **ResidentProfile calendarData prop not explicitly typed** — The interface includes `calendarData: ResidentCalendarData`, which is correct, but the import is not re-exported. Consider a shared types file if more components need this type. (likely)

---

## Verdict Justification

The implementation is well-designed and visually polished, but it deviates from the plan in three critical areas: the server action's return type (raw arrays instead of a CalendarEvent union), the missing pending rent range visualization, and the electricity bill date source (month string instead of finalizedAt). These are not stylistic differences — they affect correctness (electricity dates are wrong), type safety (no compile-time contract enforcement), and user experience (pending rent periods are not visualized). The legend mobile toggle is broken in a way that will cause production bugs. The `any` type assertions bypass TypeScript's safety guarantees.

The calendar grid layout, event mapping (modulo the above issues), tooltip, summary panel, and Apple design fidelity are all correct and match the plan. The integration with ResidentProfile is clean and non-invasive. The empty state and edge case handling are sound. The date arithmetic is correct.

With the five blocking issues fixed, this would be an approved, production-ready feature. As it stands, it needs changes before merge.
