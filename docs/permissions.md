# Xentrix Master Dashboard — role permissions

Four roles. Each row = one thing you might do. Cells = whether that role can do it, and where in the app they see the trigger.

Role ranks (`src/lib/access.ts`):

```
worker      = 1
manager     = 2
brand_admin = 3
founder     = 4  (system-wide flag on the User, not a brand membership)
```

> **Founder** is a system-wide superuser flag (`User.isFounder = true`). They pass every `requireBrandAccess` check without needing a Membership row and always resolve as role `founder` on any brand.
>
> **Membership scope**: workers / managers / brand admins only see brands they have a Membership row on. Founders see every brand.

---

## Global scope (things not tied to one brand)

| Capability | Worker | Manager | Brand Admin | Founder |
|---|:---:|:---:|:---:|:---:|
| Sign in / see own account | ✅ | ✅ | ✅ | ✅ |
| Change own name / password | ✅ | ✅ | ✅ | ✅ |
| See "My work" (`/my`) — tasks assigned to me across all brands I'm in | ✅ | ✅ | ✅ | ✅ |
| `/` — "All brands" founder overview (stat tiles + per-brand cards) | ❌ redirects to `/my` | ❌ redirects to `/my` | ❌ redirects to `/my` | ✅ |
| Trigger the weekly digest email now (`Send weekly digest now`) | ❌ | ❌ | ❌ | ✅ |
| ⌘K global search across brands / projects / tasks | ✅ own brands only | ✅ own brands only | ✅ own brands only | ✅ everything |
| ⌘⇧K Quick task capture | ✅ own brands only | ✅ own brands only | ✅ own brands only | ✅ any brand |
| Toggle dark / light theme | ✅ | ✅ | ✅ | ✅ |

## Admin section (founder-only)

| Capability | Worker | Manager | Brand Admin | Founder |
|---|:---:|:---:|:---:|:---:|
| See `Admin → Manage brands` in the sidebar | ❌ | ❌ | ❌ | ✅ |
| Create a brand (`/admin/brands/new`) | ❌ | ❌ | ❌ | ✅ |
| Edit / archive / restore a brand | ❌ | ❌ | ❌ | ✅ |
| See `Admin → Manage users` in the sidebar | ❌ | ❌ | ❌ | ✅ |
| Create a user | ❌ | ❌ | ❌ | ✅ |
| Assign/change/remove a user's brand membership | ❌ | ❌ | ❌ | ✅ |
| Grant / revoke the founder flag on a user | ❌ | ❌ | ❌ | ✅ |

## Per-brand scope (only for brands you're a member of, or all brands if founder)

### View pages

| Page | Worker | Manager | Brand Admin | Founder |
|---|:---:|:---:|:---:|:---:|
| Brand landing (`/b/[slug]`) — stat tiles + activity feed | ✅ | ✅ | ✅ | ✅ |
| Tasks kanban (`/b/[slug]/tasks`) | ✅ | ✅ | ✅ | ✅ |
| Individual task detail (`/b/[slug]/tasks/[id]`) | ✅ | ✅ | ✅ | ✅ |
| Projects list + individual project (`/b/[slug]/projects[/[projectSlug]]`) | ✅ | ✅ | ✅ | ✅ |
| Team (`/b/[slug]/team`) | ✅ | ✅ | ✅ | ✅ |
| Recurring tasks (`/b/[slug]/recurring`) | ✅ | ✅ | ✅ | ✅ |
| Utilization (`/b/[slug]/utilization`) | ✅ | ✅ | ✅ | ✅ |
| Invoices (`/b/[slug]/invoices`) | ✅ | ✅ | ✅ | ✅ |

### Task actions

| Action | Worker | Manager | Brand Admin | Founder |
|---|:---:|:---:|:---:|:---:|
| Create a task (form on kanban page or ⌘⇧K) | ✅ | ✅ | ✅ | ✅ |
| Change a task's status (dropdown on kanban card or detail sidebar) | ✅ | ✅ | ✅ | ✅ |
| Edit task title / description / kind / priority / assignee / due date / links | ✅ | ✅ | ✅ | ✅ |
| Comment on a task (and trigger `@mention` emails) | ✅ | ✅ | ✅ | ✅ |
| Log time on a task (minutes + note) | ✅ | ✅ | ✅ | ✅ |
| Delete own time entry | ✅ own only | ✅ own only | ✅ own only | ✅ any |
| **Delete a task** (Danger zone) | ❌ | ✅ | ✅ | ✅ |

### Projects, recurring, invoices (manager-and-up gate)

| Action | Worker | Manager | Brand Admin | Founder |
|---|:---:|:---:|:---:|:---:|
| Create a project (inline form on `/projects`) | ❌ | ✅ | ✅ | ✅ |
| Edit project fields (name, stage, brief, progress, live/repo URLs) | ❌ | ✅ | ✅ | ✅ |
| Create a recurring-task template | ❌ | ✅ | ✅ | ✅ |
| Pause / resume / delete a recurring template | ❌ | ✅ | ✅ | ✅ |
| Create an invoice | ❌ | ✅ | ✅ | ✅ |
| Change invoice status (draft → sent → paid → …) | ❌ | ✅ | ✅ | ✅ |
| Delete an invoice | ❌ | ✅ | ✅ | ✅ |

> **UI matches capability:** manager-only surfaces (New project / New recurring / New invoice forms, invoice row-actions, project edit form, task Danger zone) are hidden from workers via `canManageBrand(slug)` in each page. Workers see a read-only project detail card instead of the edit form. The server-side gates are still authoritative, so this is defense-in-depth, not the only line of defense.

---

## Where each role lands after login

| Role | Landing page |
|---|---|
| Worker | `/my` (personal task list across all brands you're in) |
| Manager | `/my` |
| Brand Admin | `/my` |
| Founder | `/` (all-brands founder overview) |

## Test credentials (Bake + Brew)

Password for all three: `Test123+`

| Email | Role | Notes |
|---|---|---|
| `worker.test@xentrix.xyz` | worker | Has a demo task "Opening checklist — kitchen" assigned |
| `manager.test@xentrix.xyz` | manager | |
| `admin.test@xentrix.xyz` | brand_admin | |
| `firas@xentrix.xyz` | founder (system flag) | Change password after testing |

**To reproduce these accounts:** `pnpm exec tsx scripts/seed-role-testers.ts`
