# myTrip Figma Blueprint (UI v4)

This folder is the handoff package for rebuilding the UI in Figma before frontend polishing.

## Goal
- Move from mixed legacy styles to one coherent design system.
- Keep the existing brand identity (`myTrip`) and current route structure.
- Ensure mobile-first behavior works cleanly for traveler, organizer, and admin roles.

## Included Files
- `tokens.mytrip-v4.json`: color/typography/radius/spacing/elevation tokens.
- `screen-map.md`: page architecture and route-to-frame mapping.

## Figma Setup Steps
1. Create pages in Figma:
   - `00 Foundations`
   - `01 Components`
   - `02 Desktop (1440)`
   - `03 Tablet (768)`
   - `04 Mobile (390)`
   - `05 Prototypes`
2. Import `tokens.mytrip-v4.json` into Tokens Studio (or copy values manually into Variables).
3. Create variables collections:
   - `Color / Light`
   - `Color / Dark`
   - `Spacing`
   - `Radius`
   - `Typography`
4. Build component sets first:
   - Button (`primary`, `secondary`, `danger`, `ghost`)
   - Input (`default`, `focus`, `error`, `disabled`)
   - Card (`default`, `elevated`, `interactive`)
   - Nav item (`default`, `hover`, `active`)
   - Status badge (`live`, `upcoming`, `completed`)
   - Modal shell
5. Build screen frames from `screen-map.md`, then wire prototype links.

## Layout Rules
- Desktop (`>=1200`): left rail + content container.
- Tablet (`768-1199`): drawer nav + stacked content.
- Mobile (`<=767`): drawer nav, single-column cards, no horizontal-scroll critical actions.
- Compact mobile (`<=480`): tighter spacing and full-width actions.

## Acceptance Checklist
- No white-on-white text/controls.
- No overlapping cards in `/dashboard` and `/dashboard/trips/:id`.
- All primary actions visible without ambiguous navigation.
- Light/dark parity on every touched core frame.

