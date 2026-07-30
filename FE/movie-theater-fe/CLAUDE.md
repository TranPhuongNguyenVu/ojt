# movie-theater-fe

React + Vite + Tailwind admin/customer frontend for MTMS. Each feature has a thin service module in `src/services/*.js` wrapping the single shared `AuthService` axios instance (`baseURL: http://localhost:8080/api/`, cookie-session auth) — follow that pattern for new API calls rather than introducing a second axios instance.

## Pricing Config (`src/pages/AdminDashboard/PricingConfig/PricingConfigPage.jsx`)

Three sections: base price by format, seat-type surcharge by format, golden hours. The first two read/write directly on `Version` (via `VersionService.getAll()` / `PricingService.updateRoomFormatPrice` / `PricingService.updateSeatTypeExtraPrice`) — there is no separate surcharge-list endpoint; seat-type surcharge values live on `version.vipPrice`/`version.couplePrice` and are read straight off the same `Version` objects used for base price. Both tables are click-to-edit inline (click the price to reveal an input + save/cancel, no separate "new value" column or always-visible form) — this is a page-local pattern (`editingFormatId`/`editingSeatType` state), not copied from elsewhere, since no other admin page in this codebase uses inline editing (Movie/Employee/Customer/Promotion management all use modals). Default sort for both tables is by price ascending. Price-changing calls go through `runWithForceRetry`, which surfaces a confirm-and-force dialog when the backend reports future showtimes would be affected (409).

## Cinema Room (`src/pages/AdminDashboard/CinemaRoomManagement/`)

Status is `ACTIVE`/`INACTIVE` only (`ROOM_STATUS` in `shared/cinemaRoomFormConstants.js`) — there's no "deleted" room state. `CinemaRoomService.deactivate(id)` (the old `.delete`) sets `INACTIVE`, not a soft-delete flag; always read/render status straight from `room.status`, never re-derive it client-side.

`CinemaRoomDetail.jsx` shows each seat's computed price (base + seat-type surcharge for the currently selected format) using the `prices` array the backend already attaches to each seat from `GET /cinema-rooms/{id}/seats` — never compute the seat price arithmetic in the frontend. If a room supports more than one format, a small tab selector above the seat grid picks which format's price is shown; `SeatGrid`'s `showPrices` prop renders a compact `priceLabel` (e.g. `70K`, via `formatVndShort`) under the seat number.

## Movie management (`src/pages/AdminDashboard/MovieManagement/`)

Statuses: `UPCOMING`, `SHOWING`, `ENDED`, `INACTIVE`, `DELETED` (no `UNSCHEDULED` — merged into `INACTIVE`, matching the backend). Default list sort is status priority (upcoming → showing → inactive → ended → deleted) then movie name (`compareMoviesByStatusThenName` in `shared/movieFormConstants.js`) — there was no existing sort before this, it's applied client-side in the `filtered` memo.

## Showtime management (`src/pages/AdminDashboard/ScheduleManagement/ScheduleManagement.jsx`)

Default sort for the table view is schedule status priority (scheduled → sold out → cancelled → deleted) then start time ascending (`compareSchedulesByStatusThenStartTime` in `shared/scheduleFormConstants.js`). The status itself is unchanged (`SCHEDULED`/`SOLD_OUT`/`CANCELLED`/`DELETED`) — only the sort order is new; there was no status column/badge in this table before or after.

## Table headers

All `<th>` column headers across the app follow sentence case (only the first letter capitalized, proper nouns/fixed abbreviations excluded) — this does not apply to non-header text (form labels, buttons, section kickers).

## Concession (F&B) management (`src/pages/AdminDashboard/ConcessionManagement/`)

Backend tables: `FOOD`, `DRINK`, `COMBO` (id/name/description/image/status, status `ACTIVE`/`INACTIVE`/`DELETED`) each own a `CONCESSION_PRICE` row set (`size` `NONE`/`S`/`M`/`L`, `price`) via a nullable three-parent FK (`FOOD_ID`/`DRINK_ID`/`COMBO_ID`, exactly one non-null). An item is either single-priced (`NONE` only) or fully sized (`S`/`M`/`L`, no `NONE`) — enforced in `FoodService`/`DrinkService`/`ComboService` (shared checks in `ConcessionSupport`), not at the DB layer for the live schema (only the rebuild script's `CHECK`/`UNIQUE` constraints enforce it, since `ddl-auto=update` builds tables straight from JPA entities).

Endpoints: `/api/foods`, `/api/drinks`, `/api/combos`, each with `GET`, `GET /search?keyword=`, `GET /{id}` (public, role-filtered — non-admins never see `INACTIVE`/`DELETED`), and `POST`/`PUT /{id}`/`PATCH /{id}/activate`/`DELETE /{id}` (`ROLE_Admin`). Delete is a status flip to `DELETED` (price rows kept); update fully replaces the price rows (delete-then-recreate, mirroring `SeatService.recreateSeatMap`).

FE: one page (`ConcessionManagement.jsx`) with a local (non-router) tab switcher for Food/Drink/Combo, backed by `ConcessionService.js` and a single generic `AddConcessionModal`/`EditConcessionModal` pair parameterized by `itemType` (`'food' | 'drink' | 'combo'`) — `shared/concessionFormConstants.js`'s `ITEM_TYPE_META`/`CONCESSION_SERVICE_BY_TYPE` maps hold the per-type name/id keys and service functions. The price editor (`shared/ConcessionFormFields.jsx`) is a fixed 4-row NONE/S/M/L checkbox+price grid, not a dynamic add/remove-row list — toggling `NONE` on clears and disables S/M/L and vice versa, matching the DB's mutual-exclusivity rule. All Vietnamese copy lives in `CONCESSION_LABELS` in `src/constants/labels.js`; no other concession file has inline Vietnamese literals (including the `đ` currency suffix and the Pagination `itemLabel`, both pulled from `CONCESSION_LABELS` rather than hardcoded like older modules do).
