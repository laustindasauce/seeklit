# Testing Server Communication Error Handling

## Test Scenario

When `SEEKLIT_SERVER_URL` is misconfigured, the system should:

1. Detect the server communication failure
2. Redirect to `/auth?error=Server+communication+failed+-+check+configuration`
3. Display a user-friendly error message
4. Skip auto-redirect to prevent infinite loops

## Changes Made

### 1. Session Server (`client/app/session.server.ts`)

- Modified `getUser()` to detect fetch failures and throw `ServerCommunicationError`
- Updated `getUserToken()` to re-throw server communication errors

### 2. Route Loaders

Updated all protected route loaders to catch `ServerCommunicationError` and redirect with error:

- `client/app/routes/_index.tsx`
- `client/app/routes/help.tsx`
- `client/app/routes/issues.tsx`
- `client/app/routes/requests.tsx`
- `client/app/routes/settings.tsx`
- `client/app/routes/auth._index.tsx`

### 3. Auth Page (`client/app/routes/auth._index.tsx`)

- Added friendly error message for server communication failures
- Auto-redirect logic already skips when there's an error parameter

## Expected Behavior

1. User visits any protected route with misconfigured `SEEKLIT_SERVER_URL`
2. Route loader catches `ServerCommunicationError`
3. Redirects to `/auth?error=Server+communication+failed+-+check+configuration`
4. Auth page displays: "Cannot connect to the authentication server. Please check the SEEKLIT_SERVER_URL configuration or contact your administrator."
5. Auto-redirect is skipped due to error parameter
6. User can click "Try Again" to retry (which will fail again until configuration is fixed)

This prevents the infinite redirect loop and provides clear feedback about the configuration issue.
