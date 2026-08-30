# Real-Time, Offline, and Concurrent Edit Design

## Live delivery

After JWT authentication, each Socket.IO connection joins a private user room and every board room that user may access. Controllers emit board/task events only after MongoDB confirms the write. Clients merge events by record ID, so a writer receiving its own event does not create duplicates.

Events: `board:created`, `board:updated`, `board:deleted`, `task:created`, `task:updated`, `task:deleted`, `activity:created`, and `presence:update`.

## Conflict detection

Every task starts at `revision: 0`. PATCH, DELETE, and comment requests include the revision the client last read. MongoDB updates only a record whose ID and revision both match, then atomically increments the revision. A mismatch returns HTTP `409` plus the latest task. The client opens an edit-conflict dialog rather than overwriting the teammate's change.

## Offline behavior

The latest board snapshot and task-form draft are stored in localStorage. If the API is unreachable, task changes are applied locally and placed in an ordered queue. On reconnect, the client replays them. New tasks include a stable `clientId`, and a compound unique index makes creation replay-safe. Replayed stale updates still pass through the normal revision check and surface a conflict.

## Scaling note

The bundled deployment uses one application instance. For horizontal scaling, add the Socket.IO Redis adapter and sticky sessions (or WebSocket-only transport) so rooms and broadcasts span instances.

