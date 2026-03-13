# Screen Map (Figma Blueprint)

## Global Route Frames
- `/` -> `Auth / Login`
- `/forgot-password` -> `Auth / Forgot Password`
- `/reset-password` -> `Auth / Reset Password`
- `/reset-password/confirm` -> `Auth / Confirm Reset`
- `/change-password` -> `Auth / Change Password`
- `/dashboard` -> `Dashboard / Home`
- `/dashboard/trips/:tripId` -> `Trip / Summary`
- `/dashboard/trips/:tripId/itinerary` -> `Trip / Itinerary`
- `/dashboard/trips/:tripId/documents` -> `Trip / Documents`
- `/dashboard/trips/:tripId/finances` -> `Trip / Financials`
- `/dashboard/trips/:tripId/personal-data` -> `Trip / Personal Data`
- `/dashboard/trips/:tripId/messages` -> `Trip / Messages`
- `/dashboard/trips/:tripId/contact` -> `Trip / Emergency Contact`
- `/dashboard/trips/:tripId/participants` -> `Trip / Participants`
- `/dashboard/trips/:tripId/settings` -> `Trip / Settings`
- `/dashboard/files` -> `Workspace / All Files`
- `/dashboard/people` -> `Workspace / People`
- `/dashboard/account` -> `Workspace / Account`
- `/dashboard/site` -> `Workspace / Brand Settings`

## Role Variants
- Traveler:
  - Home, Trips, Messages, Account.
  - No admin panels.
- Organizer:
  - Traveler set + Files, Participants.
  - Invite and trip-management actions where authorized.
- Admin:
  - Full workspace including People and Brand Settings.
  - Create Trip and Send Invite available globally.

## Frame List by Page
1. `Auth / Login`
2. `Auth / Login (mobile)`
3. `Dashboard / Home (desktop)`
4. `Dashboard / Home (mobile)`
5. `Trip / Summary`
6. `Trip / Itinerary (list first on mobile)`
7. `Trip / Documents (table desktop, cards mobile)`
8. `Trip / Financials (table desktop, cards mobile)`
9. `Trip / Messages`
10. `Trip / Personal Data`
11. `Trip / Participants`
12. `Workspace / All Files`
13. `Workspace / People`
14. `Workspace / Account`
15. `Workspace / Brand Settings`
16. `Modal / Create Trip`
17. `Modal / Send Invite`

## Core Component Variants
- `Navigation/Sidebar`: default, active item, expanded trip subtree, collapsed/mobile drawer.
- `Navigation/Trip Subnav`: default, active, unread badge.
- `Card/Trip`: live, upcoming, completed.
- `Card/Record`: document, finance transaction, invite, message.
- `Table/Responsive`: desktop table + mobile card representation.
- `Modal`: centered desktop, bottom-sheet mobile.

## Prototype Flows
1. Login -> Dashboard Home.
2. Dashboard Home -> Open Trip -> switch between `Summary`, `Itinerary`, `Documents`, `Financials`.
3. Dashboard Home -> `Create Trip` modal open/close + validation states.
4. People -> `Send Invite` modal open/close + pending invites list.
5. Mobile: open sidebar drawer -> navigate to trip section -> close drawer.

