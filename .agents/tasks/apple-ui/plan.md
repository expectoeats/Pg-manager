# Implementation Plan: Apple UI Transformation

This plan transforms the entire PG management app to authentic Apple software design (iOS/macOS style).

## Foundation (FEAT-001): Apple Design System Base

- [ ] 1. Update `tailwind.config.js` with Apple design tokens
      Add Apple system fonts (-apple-system, BlinkMacSystemFont, SF Pro Display, Inter), Apple color palette (#007AFF blue, #34C759 green, #FF9500 orange, #FF3B30 red, #8E8E93 gray, #E5E5EA border, #F2F2F7 secondary bg), Apple border radius values (10-24px), and spacing tokens.
      Files: `tailwind.config.js`
      Verify: Run `npm run build` — no errors. Inspect generated CSS to confirm Apple tokens are included.

- [ ] 2. Update `app/globals.css` with Apple typography and utilities
      Set body font to Apple system stack with proper letter-spacing (-0.016em) and line-height (1.5). Add heading styles (h1-h6) with letter-spacing -0.022em. Define CSS custom properties for Apple shadows (--apple-shadow-card, --apple-shadow-elevated, --apple-shadow-button-hover, --apple-shadow-dialog). Add custom scrollbar styles (8px width, #C7C7CC thumb). Add spring animation keyframes with cubic-bezier(0.4,0,0.2,1). Add utility classes for focus rings and shadows.
      Files: `app/globals.css`
      Verify: Run `npm run dev`, open browser, inspect any page — font should be -apple-system, scrollbars styled, no console errors.

## UI Primitives (FEAT-002): Transform All Components

- [ ] 3. Update `components/ui/button.tsx` to Apple button styles
      Height 44px, rounded-xl (12px), font 15-16px medium, primary bg-[#007AFF], hover scale(0.98) with spring animation (NOT color change), destructive bg-[#FF3B30], outline border-[#E5E5EA], secondary bg-[#F2F2F7], ghost hover:bg-[#F2F2F7]. Icons 20px (w-5 h-5). Use transition-all duration-200 cubic-bezier(0.4,0,0.2,1).
      Files: `components/ui/button.tsx`
      Verify: Run `npm run dev`, test button hover on any page — should scale down slightly, not change color.

- [ ] 4. Update `components/ui/card.tsx` to Apple card styles
      rounded-2xl (20px), border 1px #E5E5EA, shadow using --apple-shadow-card or Tailwind multi-layer (shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.02)]), hover:shadow-elevated + translateY(-2px), padding 16-20px, CardTitle font-semibold 17-19px letter-spacing -0.022em.
      Files: `components/ui/card.tsx`
      Verify: Inspect dashboard stat cards — should have soft shadow, proper border radius, hover lifts card up.

- [ ] 5. Update `components/ui/badge.tsx` to Apple badge styles
      rounded-full or rounded-xl (12px), 10-12px font medium, padding px-3 py-1, colors with 10% opacity backgrounds (bg-[#007AFF]/10 text-[#007AFF], bg-[#34C759]/10 text-[#34C759], bg-[#FF3B30]/10 text-[#FF3B30], bg-[#FF9500]/10 text-[#FF9500]), border-transparent.
      Files: `components/ui/badge.tsx`
      Verify: Check status badges on residents page — should have subtle colored backgrounds, not harsh borders.

- [ ] 6. Update `components/ui/input.tsx` to Apple input styles
      Height 44px, rounded-xl, border #E5E5EA (1px), bg-[#FBFBFD], placeholder text-[#8E8E93], focus:ring-2 ring-[#007AFF] with blue shadow (shadow-[0_0_0_3px_rgba(0,122,255,0.1)]), font 15-16px, letter-spacing -0.016em.
      Files: `components/ui/input.tsx`
      Verify: Test input focus on add resident form — should show blue ring with subtle shadow.

- [ ] 7. Update `components/ui/select.tsx` to Apple select styles
      SelectTrigger height 44px rounded-xl border-[#E5E5EA] bg-[#FBFBFD] placeholder:text-[#8E8E93], focus:ring-2 ring-[#007AFF]. SelectContent rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]. SelectItem hover:bg-[#F2F2F7] rounded-lg. Icons (Check, ChevronDown) 20px (w-5 h-5).
      Files: `components/ui/select.tsx`
      Verify: Test dropdown on add resident form — should have soft shadow, rounded corners, hover states work.

- [ ] 8. Update `components/ui/table.tsx` to Apple table styles
      Remove grid borders. Row separator border-b border-[#E5E5EA] (1px) only. NO zebra stripes. TableHead text-[#8E8E93] font-semibold text-xs uppercase tracking-wide. TableRow hover:bg-[#F9F9FB]. Cell padding py-3 px-4, font 14-15px.
      Files: `components/ui/table.tsx`
      Verify: Check residents table, payments table — should only have horizontal row separators, no vertical borders.

- [ ] 9. Update `components/ui/dialog.tsx` to Apple dialog styles
      DialogContent rounded-2xl, border-[#E5E5EA], shadow-[0_8px_30px_rgba(0,0,0,0.12)], padding p-6. DialogOverlay bg-black/30 with backdrop-blur. DialogTitle font-semibold 19px letter-spacing -0.022em. Close button (X icon) 20px rounded-lg hover:bg-[#F2F2F7].
      Files: `components/ui/dialog.tsx`
      Verify: Open any dialog/modal — should have soft shadow, rounded corners, blurred backdrop.

- [ ] 10. Update `components/ui/tabs.tsx` to Apple tabs styles
       TabsList rounded-xl bg-[#F2F2F7] padding p-1. TabsTrigger rounded-lg px-4 py-2 text-[#8E8E93] font-medium 15px, active:bg-white text-[#1C1C1E] shadow-sm. Transition-all 200ms spring.
       Files: `components/ui/tabs.tsx`
       Verify: Check tabs on resident profile page — should have pill-style background, active tab is white with shadow.

- [ ] 11. Verify and update `components/ui/toggle-switch.tsx`
       Confirm track colors (bg-[#E5E5EA] off, bg-[#007AFF] on), knob sizes correct (md: 51x31px track, 27px knob), smooth transition 200ms, colors match Apple (blue #007AFF, green #34C759, orange #FF9500).
       Files: `components/ui/toggle-switch.tsx`
       Verify: Test toggle on add resident form food selection — should animate smoothly, colors match Apple palette.

- [ ] 12. Update remaining UI primitives
       Update skeleton.tsx (rounded-xl, bg-[#F2F2F7]), dropdown-menu.tsx (rounded-xl, shadow-elevated, items hover:bg-[#F2F2F7] rounded-lg, icons 20px), separator.tsx (bg-[#E5E5EA] h-px or w-px), label.tsx (font-medium 15px text-[#1C1C1E] letter-spacing -0.016em), toast.tsx (rounded-xl, colored backgrounds with 10% opacity, shadow-elevated).
       Files: `components/ui/skeleton.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/separator.tsx`, `components/ui/label.tsx`, `components/ui/toast.tsx`, `components/ui/toaster.tsx`
       Verify: Build succeeds, no TypeScript errors. Test each component on relevant pages.

- [ ] 13. Enforce 20px icon size across all UI components
       Search all files in components/ui/ for Lucide icon usages. Replace w-4 h-4 with w-5 h-5 (20px). Common icons: Check, ChevronDown, ChevronUp, X, Search, User, Plus, Minus. Ensure strokeWidth=2 where applicable.
       Files: All files in `components/ui/`
       Verify: Inspect icons on buttons, selects, dialogs — all should be uniform 20px size.

## Layout & Pages (FEAT-003): Apply Apple Design Throughout

- [ ] 14. Update `components/layout/Sidebar.tsx` to Apple sidebar styles
       Nav items: active state bg-[#007AFF]/10 text-[#007AFF] (NOT solid bg-[#007AFF]), hover bg-[#F2F2F7], rounded-lg (10px), padding px-3 py-2.5, icons 20px (w-5 h-5), font-medium 15px. Section labels text-[#8E8E93] text-xs font-semibold uppercase tracking-wider. Border-r border-[#E5E5EA]. User avatar rounded-full bg-[#F2F2F7]. Sign-out button hover:bg-[#FF3B30]/10 hover:text-[#FF3B30].
       Files: `components/layout/Sidebar.tsx`
       Verify: Check sidebar — active nav item should have light blue background (10% opacity), not solid blue.

- [ ] 15. Update `components/layout/TopBar.tsx` to Apple topbar styles
       Height 60px, border-b border-[#E5E5EA]. Search input rounded-full bg-[#F2F2F7] h-9 text-15px placeholder:text-[#8E8E93] focus:ring-2 ring-[#007AFF]. Bell icon button w-10 h-10 rounded-xl hover:bg-[#F2F2F7]. Icons 20px (w-5 h-5).
       Files: `components/layout/TopBar.tsx`
       Verify: Check top bar — search should be pill-shaped, bell icon 20px, proper hover states.

- [ ] 16. Update `components/layout/BottomNav.tsx` to Apple bottom nav styles
       Active text-[#007AFF], inactive text-[#8E8E93], icons 20px (w-5 h-5), font-medium 13px, padding py-3, border-t border-[#E5E5EA], bg-white with backdrop-blur.
       Files: `components/layout/BottomNav.tsx`
       Verify: Test on mobile width — bottom nav should show, active item blue, icons 20px.

- [ ] 17. Update `components/residents/AddResidentForm.tsx` to Apple form styles
       All inputs h-11 (44px) rounded-xl. Labels font-medium 15px. Stepper circles bg-[#007AFF] with ring-4 ring-[#007AFF]/20 for active, completed with Check icon 20px. Plan cards rounded-xl border-2 (active border-[#007AFF] bg-[#007AFF]/5, inactive border-[#E5E5EA]). Room/food plan icons 20px. Price summary card rounded-xl bg-[#F2F2F7] border-[#E5E5EA] padding p-4. All buttons use Apple button styles from step 3.
       Files: `components/residents/AddResidentForm.tsx`
       Verify: Test entire add resident flow — all inputs, selects, cards, buttons should match Apple design. Check stepper, plan selection cards, room layout preview.

- [ ] 18. Update `components/rooms/RoomLayoutPreview.tsx` to Apple preview styles
       Card rounded-2xl. Bed cards rounded-xl padding p-3 border-2 (vacant border-[#34C759] bg-[#34C759]/5, occupied border-[#FF3B30] bg-[#FF3B30]/5). Icons 20px. Status dots w-2.5 h-2.5 rounded-full. Electricity bill alert rounded-xl bg-[#FF9500]/10 border-[#FF9500]/20.
       Files: `components/rooms/RoomLayoutPreview.tsx`
       Verify: Select a room in add resident form — layout preview should show with Apple-styled bed cards and colors.

- [ ] 19. Update dashboard page `app/(dashboard)/dashboard/page.tsx`
       Stat cards use Card component (already Apple-styled). Icon containers w-12 h-12 rounded-xl with 10% opacity backgrounds. Icons 20px. Heading font-semibold 22px letter-spacing -0.022em. Subtext text-[#8E8E93] 15px. Grid gaps gap-4.
       Files: `app/(dashboard)/dashboard/page.tsx`
       Verify: Dashboard stat cards should have soft shadows, proper spacing, icons 20px in colored rounded containers.

- [ ] 20. Update residents pages
       Update `app/(dashboard)/residents/page.tsx`: Search/filters match TopBar style, table uses Apple table styles (no grid borders), status badges Apple style, action buttons 20px icons rounded-lg hover:bg-[#F2F2F7]. Update `app/(dashboard)/residents/[id]/page.tsx`: Header photo rounded-2xl, tabs use Apple tabs component, action buttons Apple style, tables Apple style, all icons 20px.
       Files: `app/(dashboard)/residents/page.tsx`, `app/(dashboard)/residents/[id]/page.tsx`
       Verify: Residents list table has row separators only. Resident profile tabs are Apple-styled. All icons 20px.

- [ ] 21. Update rooms, plans, rent pages
       Update `app/(dashboard)/rooms/page.tsx`: Room cards rounded-2xl border-[#E5E5EA] shadow-apple-card, bed icons 20px, colors (#34C759 / #FF3B30), hover translateY(-2px) + shadow-elevated. Update `app/(dashboard)/plans/page.tsx`: Plan cards/table Apple styled, dialogs use Apple dialog, toggles already styled, meal icons 20px, price text-[#007AFF]. Update `app/(dashboard)/rent/page.tsx`: Month selector Apple select style, summary cards Apple style, table Apple style, buttons Apple style, badges Apple style, icons 20px.
       Files: `app/(dashboard)/rooms/page.tsx`, `app/(dashboard)/plans/page.tsx`, `app/(dashboard)/rent/page.tsx`
       Verify: Rooms page cards lift on hover. Plans toggles work smoothly. Rent page table has proper Apple styling.

- [ ] 22. Update payments, deposits, electricity pages
       Update `app/(dashboard)/payments/page.tsx`: Ledger table Apple style (row separators, hover:bg-[#F9F9FB]), filters Apple style, icons 20px, reversal badges bg-[#FF9500]/10. Update `app/(dashboard)/deposits/page.tsx`: Tabs Apple style, deposit cards rounded-xl, eligibility indicators with Apple colors and 20px icons. Update `app/(dashboard)/electricity/page.tsx`: Form inputs h-11 rounded-xl, selectors Apple style, preview cards rounded-xl, buttons Apple style, Zap icon 20px.
       Files: `app/(dashboard)/payments/page.tsx`, `app/(dashboard)/deposits/page.tsx`, `app/(dashboard)/electricity/page.tsx`
       Verify: All tables use row separators only. Forms use 44px inputs. Icons are 20px.

- [ ] 23. Update expenses, reports, settings, activity-log pages
       Update `app/(dashboard)/expenses/page.tsx`: Form inputs Apple style, category badges Apple style, table Apple style. Update `app/(dashboard)/reports/page.tsx`: Report cards rounded-2xl shadow-apple-card, export buttons Apple style, date pickers Apple style. Update `app/(dashboard)/settings/page.tsx`: Form inputs h-11 rounded-xl, labels font-medium 15px, separators bg-[#E5E5EA] h-px, toggles already styled, save button Apple primary. Update `app/(dashboard)/activity-log/page.tsx`: Table Apple style, badges Apple style, filters Apple style, icons 20px.
       Files: `app/(dashboard)/expenses/page.tsx`, `app/(dashboard)/reports/page.tsx`, `app/(dashboard)/settings/page.tsx`, `app/(dashboard)/activity-log/page.tsx`
       Verify: All pages follow consistent Apple design. No generic Material Design elements remain.

- [ ] 24. Global icon size enforcement across all pages
       Search all files in app/(dashboard)/ and components/ (excluding ui/) for Lucide icon usages. Replace w-4 h-4 with w-5 h-5 (20px). Common icons: User, Users, DoorOpen, BedDouble, Bed, Receipt, CreditCard, Wallet, Zap, ShoppingCart, BarChart2, Settings, Clock, LogOut, Bell, Search, Check, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Info, Banknote, Smartphone, Landmark, Coffee, Moon, Sun, Utensils, UtensilsCrossed, Building2, TrendingUp, LayoutDashboard, ListCheck, X, Plus, Minus, Edit, Trash.
       Files: All relevant files in `app/(dashboard)/` and `components/` (layout, residents, rooms, etc.)
       Verify: Visual inspection of every page — all icons should be uniform 20px size.

- [ ] 25. Test responsive behavior across all breakpoints
       Test mobile view (BottomNav visible, Sidebar hidden), tablet view, desktop view. Ensure all Apple styles work: cards maintain rounded-xl, proper padding, touch-friendly sizes (min 44px tap targets), navigation transitions smooth, no layout shift.
       Files: N/A (testing step)
       Verify: Resize browser from mobile (375px) to desktop (1440px+). All pages should look native Apple at every size. BottomNav shows on mobile, Sidebar on desktop. All interactive elements maintain 44px minimum height.

## Final Verification

- [ ] 26. Complete visual and functional audit
       Navigate through every page: dashboard, residents, residents/new, residents/[id], rooms, plans, rent, payments, deposits, electricity, expenses, reports, settings, activity-log. Verify: all icons 20px, all inputs 44px, all borders 1px #E5E5EA, all shadows soft multi-layer, all interactions spring-animated (buttons scale on hover, NOT color change), all colors match Apple palette, typography is -apple-system with proper letter-spacing, no console errors.
       Files: N/A (audit step)
       Verify: Run `npm run build` — no errors. Run `npm run dev` — no console errors. Compare against Apple design spec checklist. Take screenshots and compare to iOS/macOS native apps for authenticity.
