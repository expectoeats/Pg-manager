# Routing fix and Phases 2+3 — rooms, plans, residents CRUD

All dashboard pages were returning 404 because nav hrefs used `/dashboard/residents` etc. while the App Router route group `(dashboard)` resolves those pages to `/residents`, `/rooms`, etc. This commit corrects the hrefs in `Sidebar.tsx` and `BottomNav.tsx`, implements full CRUD for rooms and plans (Phase 2), adds the residents list, add-resident multi-step form, and resident profile (Phase 3), ships service and validator layers, and upgrades the remaining placeholder pages.

Watch for: **(confirmed)** The middleware in `proxy.ts` only protects `/dashboard/*` and `/`, leaving every new route (`/residents`, `/rooms`, `/plans`, `/rent`, etc.) without middleware-level auth enforcement. Protection is currently provided only by the `(dashboard)` layout server component calling `auth()`, which is a weaker line of defense. **(confirmed)** `updateRoom` accepts `totalBeds` in its payload and writes it directly to `Room.totalBeds` without syncing the `Bed` collection, so the stored count can diverge from actual beds. **(confirmed)** A stale placeholder page at `app/(dashboard)/activity/` (old path) still exists and is reachable at `/activity` — it is dead navigation but a live URL.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The nav href fix is correct and complete. Sidebar now points to `/residents`, `/rooms`, `/plans`, `/activity-log`, etc., which match the App Router paths produced by the `(dashboard)` route group. `BottomNav.tsx` is also fixed, and the "More" shortcut now routes to `/settings` rather than a non-existent `/dashboard/more`.

The middleware (`proxy.ts`) checks `isDashboardPage = nextUrl.pathname.startsWith('/dashboard')` but none of the new feature pages begin with `/dashboard`. Unauthenticated requests to `/residents` or `/rooms` bypass the middleware redirect entirely. The layout's `auth()` call catches them server-side before rendering, but the middleware-level redirect (which runs on the edge before the server render) never fires for these paths.

The check-in service is the most business-critical piece. It correctly uses a MongoDB transaction via `mongoSession.withTransaction`, verifies bed vacancy inside the transaction, creates a proration-aware `RentRecord`, and writes an `ActivityLog` entry. The `joining_cycle` billing mode is fetched and stored but the first-month `amountDue` calculation has no branch for it — it falls through to the full plan price without prorating, which is correct by definition for that mode but is not explicitly documented or tested.

The `updateRoom` service accepts `totalBeds` as part of the validated payload and writes it directly to `Room.totalBeds`. The UI hides the bed-count field on edit, but the server-side action has no such guard: a direct call with a different `totalBeds` will update the Room document without adding or removing `Bed` documents, producing a mismatch. This is a data-integrity gap that will surface silently.

An orphan page lives at `app/(dashboard)/activity/page.tsx` (the old path before the rename to `activity-log`). It is unreachable from nav but still a live route at `/activity`. It should be deleted.

The `givePlanChange` function in `residents.ts` fetches the resident after updating (`const resident = await Resident.findById(residentId).lean()`) and never uses the result. This is a dead DB query on every plan change.

---

<details>
<summary>Issues (5)</summary>

1. **Middleware auth gap** — `proxy.ts` only protects `/dashboard/*` but all new pages live at `/residents`, `/rooms`, `/plans`, etc. Update `isDashboardPage` to cover all protected routes (e.g. exclude only `/login` and public assets) so unauthenticated users are redirected at the edge, not just at the layout render.

2. **`updateRoom` totalBeds divergence** — `updateRoom` accepts and persists `totalBeds` but does not add or remove `Bed` documents to match. Add a server-side guard that strips `totalBeds` from the update payload (or validates that it equals the existing room's count) to prevent Room.totalBeds drifting from the actual bed count.

3. **Orphan `/activity` route** — `app/(dashboard)/activity/page.tsx` was not deleted when `activity-log/page.tsx` was created. Delete it to remove the dead route.

4. **`joining_cycle` billing mode unimplemented silently** — When `billingMode` is `joining_cycle`, the first-month rent should use `joiningDate.getDate()` as the recurring due day, not the `rentDueDay` setting. The current code produces the same `amountDue` (full price, no prorate) for both modes, which is correct, but the `dueDate` is always `new Date(Date.UTC(year, month, rentDueDay))` regardless of mode. For `joining_cycle` the due date should be `joiningDate.getDate()` of the following month. Add this branch or document it as a known gap.

5. **Dead DB query in `givePlanChange`** — `const resident = await Resident.findById(residentId).lean()` is called after the update but the result is never used. Remove it.

</details>

---

<details>
<summary>Details</summary>

## Middleware does not protect new routes (confirmed)

`proxy.ts` reads:

```ts
const isDashboardPage =
  nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/';
```

All feature pages — `/residents`, `/rooms`, `/plans`, `/rent`, `/payments`, `/deposits`, `/electricity`, `/expenses`, `/reports`, `/settings`, `/activity-log` — are inside the `(dashboard)` route group, which means their URL paths do not include `dashboard`. None of them match `startsWith('/dashboard')`.

The `(dashboard)/layout.tsx` does call `auth()` and redirects to `/login` if unauthenticated, so actual page data is never rendered to an unauthenticated user. But the middleware, which runs on the edge before the server component, never fires a redirect for these paths. This means:
- The edge-level redirect (fast, CDN-cached) never runs for feature pages
- Any future API routes or page props that don't go through the layout are exposed

The fix is straightforward: change `isDashboardPage` to match all non-public paths, e.g. by inverting — protect everything except `/login`.

## `updateRoom` totalBeds drift (confirmed)

`updateRoom` validates with `roomSchema`, which includes `totalBeds`, and then does:

```ts
await Room.findByIdAndUpdate(roomId, { $set: parsed.data });
```

This writes a new `totalBeds` value to `Room` if the caller includes it. The form UI disables the bed count field on edit and shows "Bed count cannot be changed after creation," but there is no server-side enforcement. The schema accepts any integer 1–10. A direct server action call (or a future admin feature) can change `Room.totalBeds` without touching the `Bed` collection, causing the displayed occupancy count (`occupiedCount/beds.length`) to misrepresent capacity.

## Orphan activity page (confirmed)

`app/(dashboard)/activity/page.tsx` exists from Phase 1 and was not deleted when `activity-log/page.tsx` was added. The sidebar correctly points to `/activity-log`. The old page at `/activity` remains a live 200 route with stale "Phase 8 — coming soon" text, accessible if someone navigates there directly.

## `joining_cycle` due date gap (likely)

For `billingMode === 'joining_cycle'`, the due date should repeat on the joining day of each month. The current code always uses `rentDueDay` from Settings:

```ts
const dueDate = new Date(Date.UTC(year, month, rentDueDay));
```

Under `joining_cycle` this should be `joiningDateObj.getUTCDate()` instead of `rentDueDay`. The `amountDue` is the same (full price, no prorate) either way, so the only impact is the displayed due date on the first `RentRecord`.

## Dead DB query in `givePlanChange` (confirmed)

```ts
// Update resident's currentPlan
await Resident.findByIdAndUpdate(residentId, { currentPlan: newPlanId });

const resident = await Resident.findById(residentId).lean(); // ← result never used
```

This fires an extra DB round trip on every plan change. Removing it has no behavioral impact.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `components/layout/Sidebar.tsx` | Fixed all nav hrefs from `/dashboard/X` to `/X`; `/activity-log` corrected |
| `components/layout/BottomNav.tsx` | Fixed hrefs; "More" now routes to `/settings` |
| `app/(dashboard)/rooms/page.tsx` | Upgraded from placeholder to server component calling `getRoomsWithBeds` |
| `app/(dashboard)/plans/page.tsx` | Upgraded from placeholder to server component calling `getPlans` |
| `app/(dashboard)/residents/page.tsx` | Upgraded to async server component with filter support via `searchParams` |
| `app/(dashboard)/residents/new/page.tsx` | New — loads active plans, rooms, settings and renders `AddResidentForm` |
| `app/(dashboard)/residents/[id]/page.tsx` | New — resident profile page with plan history and active plan list |
| `app/(dashboard)/residents/[id]/checkout/page.tsx` | New — Phase 7 placeholder with resident name in heading |
| `app/(dashboard)/activity-log/page.tsx` | New — Phase 8 placeholder at correct `/activity-log` path |
| `app/(dashboard)/{deposits,electricity,expenses,payments,rent,reports}/page.tsx` | Upgraded placeholders with proper headings and coming-phase cards |
| `components/rooms/RoomsClient.tsx` | New — full rooms CRUD client component with filter, add/edit dialog |
| `components/rooms/RoomCard.tsx` | New — room card with bed status visualization |
| `components/plans/PlansClient.tsx` | New — full plans CRUD client component with toggle-active |
| `components/residents/ResidentsList.tsx` | New — residents list with search, filter, and card/table views |
| `components/residents/AddResidentForm.tsx` | New — 4-step check-in form with prorated rent preview |
| `components/residents/ResidentProfile.tsx` | New — resident profile with tabs, plan change, and notice dialogs |
| `lib/services/rooms.ts` | New — `getRooms`, `getRoomsWithBeds`, `createRoom`, `updateRoom`, `toggleRoomActive` |
| `lib/services/plans.ts` | New — `getPlans`, `createPlan`, `updatePlan`, `togglePlanActive` |
| `lib/services/residents.ts` | New — `getResidents`, `getResident`, `getPlanHistory`, `givePlanChange`, `giveNotice` |
| `lib/services/checkin.ts` | New — `checkInResident` (transactional check-in), `getVacantBedsByRoom` |
| `lib/validators/room.ts` | New — Zod schema for room form |
| `lib/validators/plan.ts` | New — Zod schema for plan form |
| `lib/validators/resident.ts` | New — Zod schema with Indian mobile regex `/^[6-9]\d{9}$/` |

Full diff: `git diff HEAD~1` against commit `17117b9`

</details>
