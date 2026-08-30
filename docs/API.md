# PMS REST API Contract

Base path: `/api`. JSON is used for request and response bodies. Protected routes require `Authorization: Bearer <access-token>`. The rotating refresh token is stored in an HTTP-only cookie scoped to `/api/auth`.

## Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a member, starter board, and session |
| POST | `/auth/login` | Sign in with email or username and password |
| POST | `/auth/refresh` | Rotate refresh session and return a new access token |
| POST | `/auth/logout` | Revoke the current refresh token |
| GET | `/auth/me` | Return the signed-in user |
| PATCH | `/auth/profile` | Update display name, email, or avatar color |

Registration body: `{ "displayName", "username", "email", "password" }`.

## Boards and members

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/boards` | Joined boards; all active boards for an administrator |
| POST | `/boards` | Authenticated user |
| GET | `/boards/:boardId` | Board member or administrator |
| PATCH | `/boards/:boardId` | Board owner or administrator |
| DELETE | `/boards/:boardId` | Board owner or administrator; archives the board |
| POST | `/boards/:boardId/members` | Board owner or administrator |
| DELETE | `/boards/:boardId/members/:userId` | Board owner or administrator |
| GET | `/users?search=` | Authenticated member picker |

Board roles are `owner`, `editor`, and `viewer`.

## Tasks and comments

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/boards/:boardId/tasks` | `clientId` makes offline replays idempotent |
| GET | `/boards/:boardId/tasks/:taskId` | Returns populated task details |
| PATCH | `/boards/:boardId/tasks/:taskId` | Requires `expectedRevision` |
| DELETE | `/boards/:boardId/tasks/:taskId` | Requires `expectedRevision` |
| POST | `/boards/:boardId/tasks/:taskId/comments` | Requires `message` and `expectedRevision` |

Task fields: `title`, `description`, `status` (`todo`, `doing`, `done`), `progress` (0–100), `priority` (`low`, `medium`, `high`, `urgent`), `category`, `assignee`, `dueDate`, `tags`, `position`, `comments`, and timestamps. The UI labels the three stored statuses Assigned, Ongoing, and Done.

A stale mutation returns HTTP `409`:

```json
{
  "message": "This task was changed by a teammate...",
  "details": {
    "code": "EDIT_CONFLICT",
    "latestTask": { "id": "...", "revision": 4 }
  }
}
```

## Member requests

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/requests/mine` | List the signed-in member's requests |
| POST | `/requests` | Submit an access, role, or support request |

## Administration

All routes below require an administrator JWT.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/summary` | System counts and recent activity |
| GET | `/admin/users` | List all accounts |
| PATCH | `/admin/users/:userId` | Change system role or active state |
| GET | `/admin/requests` | List all member requests |
| PATCH | `/admin/requests/:requestId` | Approve, reject, respond to, or reopen a request |

## Status codes

`200` success, `201` created, `204` no content, `401` authentication failure, `403` permission failure, `404` missing record, `409` duplicate/conflicting state, `422` invalid input, and `428` missing task revision.
