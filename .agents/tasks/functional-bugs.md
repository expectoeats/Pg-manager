# Functional Bugs to Fix (After Apple UI)

## 1. Bed Selection - toJSON Error ❌ CRITICAL
**Error:** "Only plain objects can be passed to Client Components from Server Components. Objects with toJSON methods are not supported."

**Root cause:** `getVacantBedsByRoom()` returns Mongoose documents, not plain objects.

**Fix location:** `lib/services/checkin.ts` line ~20
```typescript
// BEFORE:
const beds = await Bed.find({ room: roomId, status: 'vacant' }).lean();

// AFTER: (already has .lean() — the issue is in the component)
```

Actually the issue is in `AddResidentForm.tsx` — the `JSON.parse(JSON.stringify(beds))` hack doesn't work with Mongoose. Need to ensure `.lean()` is used AND the data is properly serialized in the page component before passing to client.

**Action:** In `app/(dashboard)/residents/new/page.tsx`, serialize the data:
```typescript
const data = {
  activePlans: JSON.parse(JSON.stringify(plans.filter(p => p.isActive))),
  activeRooms: JSON.parse(JSON.stringify(rooms.filter(r => r.isActive))),
  settings: JSON.parse(JSON.stringify(settings))
};
```

## 2. Deposit Should Be Included in First Month Payment Total ❌

**Current behavior:** Deposit (₹2000) is shown separately from first month rent (₹490)

**Expected behavior:** First month total = Deposit + Prorated Rent
- Example: Room ₹5000 + Food ₹2600 = ₹7600/month
- Joining on 30th Oct means 2 days remaining in October
- Prorated rent: (7600 × 2) / 31 = ₹490
- **First month total to pay = ₹2000 (deposit) + ₹490 (rent) = ₹2490**

**Fix location:** `components/residents/AddResidentForm.tsx`
- In the "First Month Rent" summary section, ADD a row showing deposit
- Change the label from "First month (prorated)" to "Total due on joining"
- Calculate: `const totalDueOnJoining = depositAmount + firstMonthRent`
- Display the breakdown:
  ```
  Deposit: ₹2,000
  First month rent (prorated): ₹490
  ─────────────────────────
  Total due on joining: ₹2,490
  ```

## 3. Room Layout Visualization When Selecting Bed ❌

**Current behavior:** Just a dropdown showing vacant beds

**Expected behavior:** When a room is selected, show a visual room layout card on the right/below with:
- Room number and type (Double/Triple)
- All beds in that room as visual tiles/boxes
- Each bed shows:
  - Bed label (A, B, C)
  - Status color: Green (vacant), Red (occupied)
  - If occupied: show resident name
- Current month's electricity bill for that room (if available)

**Fix location:** Create new component `components/rooms/RoomLayoutPreview.tsx`

**Implementation approach:**
1. When room is selected in AddResidentForm, fetch ALL beds for that room (not just vacant)
2. Fetch the current month's ElectricityBill for that room (if exists)
3. Show a card with:
   - Bed grid (2 columns for double, 3 for triple)
   - Each bed as a rounded card with:
     - Label at top
     - Status indicator (circle: green/red)
     - Resident name if occupied
   - Below the grid: "Current electricity bill: ₹XXX" (if bill exists)

**API needed:** Add new server action:
```typescript
// lib/services/rooms.ts
export async function getRoomLayoutWithBills(roomId: string) {
  // Fetch room with all beds (occupied + vacant) + residents
  // Fetch current month electricity bill for this room
  // Return serialized data
}
```

## 4. Electricity Meter Reading Tracking Per Resident ❌

**Current behavior:** Electricity bill is per-room, split equally

**Expected behavior:** Track individual meter reading per resident:
- When resident joins, record the current meter reading
- Each month, track usage per resident
- Show in resident profile: "Joined at reading: 1234 kWh, Current: 1456 kWh, Monthly avg: 74 kWh"

**Fix location:** 
- Update `Resident` model to add: `electricityMeterReadingOnJoining: number`
- Update check-in flow to ask for current meter reading
- Update resident profile to show this data
- Update electricity bill calculation to consider individual usage

**Implementation notes:**
- This is a MAJOR feature change — requires discussion with PG owner
- Current system: one meter per room, split equally
- New system would need: one meter per resident (or tracking who used what)
- **Recommendation:** Keep current system (room-level meter) for v1, add per-resident tracking in v2

## 5. Prorated Rent Explanation ❌ (UI/UX issue, not a bug)

**Current label:** "First month (prorated): ₹490"

**User confusion:** What does prorated mean?

**Better label:**
```
First month rent (2 days remaining in Oct): ₹490
(Full month: ₹7,600, Daily rate: ₹245)
```

Or even simpler:
```
Rent for Oct 30-31 (2 days): ₹490
```

**Fix location:** `AddResidentForm.tsx` — improve the label and add a tooltip/help text

---

## Priority Order

1. **CRITICAL:** Fix bed selection toJSON error (blocks adding residents)
2. **HIGH:** Show deposit + rent total clearly (₹2490 not ₹490)
3. **MEDIUM:** Room layout visualization (nice UX improvement)
4. **LOW:** Better prorated rent explanation
5. **FUTURE:** Per-resident meter tracking (requires schema changes + discussion)

## Next Steps After Apple UI Completes

1. Let the Apple UI workflow finish (fixes all buttons to blue, adds toggle switches)
2. Fix the toJSON error immediately
3. Update first month payment UI to show deposit + rent total
4. Build the room layout preview component
5. Test full check-in flow end-to-end
