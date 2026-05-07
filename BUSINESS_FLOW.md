# Business Flow — Fathom Maritime Operations & Compliance

This document captures the end-to-end business journey of the system, the
roles involved, the lifecycle of each entity, and how compliance is computed.

---

## 1. Roles

### Admin (Fleet / Operations Manager)
- Owns the fleet and crew records.
- Plans maintenance work and schedules safety drills.
- Monitors compliance across all ships.

### Crew (Officers / Engineers / Bosun / etc.)
- Belongs to one ship.
- Receives the maintenance tasks assigned to them.
- Sees the upcoming drills for their ship and records their own attendance.
- Logs notes / status updates on their tasks.

---

## 2. Core entities

| Entity                  | Purpose                                                           |
|-------------------------|-------------------------------------------------------------------|
| `Ship`                  | A vessel in the fleet, identified by name + IMO number.           |
| `User`                  | Admin or crew member; crew are anchored to a ship.                |
| `MaintenanceTask`       | Work item against a ship, with a due date and priority.           |
| `TaskComment`           | Notes posted on a maintenance task by admin or assignee.          |
| `Drill`                 | A scheduled safety exercise (fire, evacuation, etc.) on a ship.   |
| `DrillParticipation`    | Per-crew-member attendance record for a given drill.              |

```
Ship 1 ─────────* MaintenanceTask *──────── 1 User (assignee)
  │                                         │
  *                                         *
  │                                         │
  Drill *────* DrillParticipation *────── User (crew)
```

---

## 3. Maintenance flow

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  Admin creates task │ →  │  Crew gets task in  │ →  │  Crew sets status   │
│  • picks ship       │    │  their list /       │    │  pending→in_progress│
│  • sets priority    │    │  dashboard          │    │     →completed      │
│  • due date         │    │                     │    │  Adds notes/comments│
│  • optional assignee│    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │  If due_date < today and    │
                        │  status != completed →       │
                        │  flagged "overdue" on UI &   │
                        │  counted as non-compliant    │
                        └─────────────────────────────┘
```

Crew can only see/update tasks assigned to them; the API enforces this on
every read and write.

---

## 4. Drill flow

```
┌─────────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
│  Admin schedules    │ →  │  Crew of ship sees   │ →  │  Crew marks own    │
│  drill on a ship    │    │  upcoming drill on   │    │  attendance        │
│  with date/time +   │    │  dashboard / drills  │    │  (attended | absent)
│  type               │    │  page                │    │                    │
└─────────────────────┘    └──────────────────────┘    └────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │  Admin marks drill completed │
                        │  (post-drill, with notes)    │
                        └──────────────────────────────┘
                                       │
                              if scheduled_date < now
                              and not completed
                                       ▼
                        ┌──────────────────────────────┐
                        │  Auto-marked as MISSED on    │
                        │  next compliance read        │
                        └──────────────────────────────┘
```

`autoMarkMissedDrills` is invoked at the start of every compliance dashboard
load. This avoids needing a separate cron and keeps the data self-healing
even on a fresh deployment.

---

## 5. Compliance computation

### Inputs (per ship)
- `T_total` = number of maintenance tasks ever created
- `T_done` = tasks with status = completed
- `T_overdue` = tasks past due date and not completed
- `D_elapsed` = drills whose scheduled date is in the past
- `D_done` = drills with status = completed (within `D_elapsed`)
- `D_missed` = drills past scheduled date but not completed
- `attendance_marks` = sum across `D_done` of crew members marked `attended`
- `crew_size` = active crew users assigned to this ship

### Per-ship metrics

```
maintenance_pct       = (T_done   / T_total)        × 100
drill_completion_pct  = (D_done   / D_elapsed)      × 100   (100 if no elapsed)
participation_pct     = (attendance_marks /
                         (crew_size × D_done))      × 100   (100 if no D_done)

overall_score = round(
    maintenance_pct       × 0.50
  + drill_completion_pct  × 0.30
  + participation_pct     × 0.20
)
```

### Classification

| Score range | Class            |
|-------------|------------------|
| ≥ 90        | `compliant`      |
| 70 – 89     | `at_risk`        |
| < 70        | `non_compliant`  |

Fleet-level overall is the simple average across all ships' overall scores.

### Why this weighting?
Maintenance is the largest carrier of operational risk on a ship, so it
carries the highest weight (0.5). Drill completion vs participation is
weighted 0.3 + 0.2 because completing the drill is more visible at the fleet
level than per-crew participation, but both still matter to the regulator's
view of safety culture.

---

## 6. Risk highlighting

The compliance API for each ship returns explicit lists of:

- `overdue_tasks` — id, title, due date, priority, status
- `missed_drills` — id, title, scheduled date, drill_type

The admin dashboard also highlights ships with `non_compliant` /
`at_risk` classifications and shows count of overdue / missed items.

Crew see overdue tasks highlighted in their personal list (rose-tinted row,
red due date) so they can self-prioritise.

---

## 7. Auth & access control

- Login at `/api/auth/login` returns a JWT with `{ id, role }` payload.
- Every subsequent call must send `Authorization: Bearer <token>`.
- `requireAuth` middleware loads the fresh user record from DB on every
  call (so deactivating a user revokes them within one request).
- `requireRole('admin')` is layered on top of routes that change schema-level
  data (creating ships, crew, tasks, drills).
- Crew's listing endpoints automatically scope to:
  - tasks: `assigned_to = me`
  - drills: `ship_id = my ship`
  - task detail: must be the assignee
  - drill detail: must belong to my ship

---

## 8. Sample storyboard

1. **Admin** logs in → fleet dashboard shows score = 43% (non-compliant) with
   3 overdue tasks and 2 missed drills.
2. Admin clicks _Maintenance_ → filters by ship `MV Aurora` and `overdue` →
   sees `Lifeboat hoist inspection` flagged red. Reassigns it to the master.
3. Admin clicks _Drills_ → schedules a `man_overboard` drill for `MV Aurora`
   four days out.
4. **Captain Rao** (crew on Aurora) signs in → his dashboard shows the
   newly-assigned task and the upcoming drill.
5. Captain opens the task → posts a note "Spares ETA Friday", sets status to
   `in_progress`. The dashboard score recomputes on next load.
6. On the day of the drill, Captain visits the drill and marks himself
   `attended` with remarks "All hands present".
7. Admin opens the drill, adds notes "Smooth, 7 minutes", marks it complete.
8. Fleet dashboard refreshes — `MV Aurora`'s drill completion + participation
   percentages climb, overall score nudges upward.
