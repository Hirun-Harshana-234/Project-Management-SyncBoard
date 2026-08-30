# Production Deployment Checklist

1. Provision a managed MongoDB database and restrict network access to the application host.
2. Set `MONGO_URI`, unique 32+ character JWT secrets, and strong administrator credentials.
3. Build and run the root `Dockerfile`; expose the application on port `8080`.
4. Configure HTTPS at the hosting platform or reverse proxy. Secure refresh cookies turn on automatically in production.
5. Keep one application instance unless a Socket.IO cross-instance adapter has been configured.
6. Verify `GET /api/health` returns `200`.
7. Register two non-admin users, add both to a board, and test live task movement in separate browsers.
8. Submit a deliberately stale task revision and verify the client displays the conflict dialog.
9. Disconnect one browser, create a task, reconnect it, and verify the pending queue synchronizes.
10. Confirm the CI workflow is green and configure database backups before inviting real users.

The included `render.yaml` creates the application service, but `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` must be entered securely in the platform dashboard.

