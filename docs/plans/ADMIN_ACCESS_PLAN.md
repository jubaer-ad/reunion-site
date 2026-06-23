# Admin Access and Request Flow Plan

## Goal
Add a simple admin-request workflow so that:
- any user can request admin access,
- the developer can grant admin access directly in the database,
- only authenticated admins can edit and delete participant records,
- these privileged actions are protected by authentication.

## Requirements
1. Users can submit an admin request from the site.
2. The developer can create admin accounts directly in the database.
3. Admin users can log in with a username and password.
4. Only authenticated admins can edit or delete records.
5. The UI should show login/request state clearly.
6. Public users can still view registrations and export data.

## What already exists
- Public registration form and participant list UI.
- Participant CRUD API routes for create/list/update/delete.
- Protected update/delete routes that require an authenticated admin session.
- A basic login route that checks `admin_users` and sets a secure session cookie.
- Database initialization logic that creates `admin_users` and `admin_requests` tables.

## What still needs to be implemented
1. Admin request endpoint to insert into `admin_requests`.
2. Admin login/logout UI on the main page.
3. A way to check whether the current user is an admin and show the correct UI state.
4. Frontend gating so edit/delete buttons are hidden or disabled for non-admins.
5. A simple request form for users to ask for admin access.
6. Optional: list and review admin requests from the database later.

## Implementation checklist
- [x] Public registration and participant listing
- [x] Protected update/delete API routes
- [x] Basic admin login backend
- [x] Database initialization for admin tables
- [x] Admin request submission API
- [x] Admin login/logout UI
- [x] Frontend gating for edit/delete access
- [ ] Optional admin request review dashboard
- [ ] Optional logout flow in a dedicated admin page

## Notes for the developer
- To grant admin access, insert a row into `admin_users` directly in the Neon database.
- For local development, a simple username/password combination can be used and hashed through the existing auth helper.
- The request is stored in `admin_requests` and can be reviewed manually later.
