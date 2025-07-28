# Authentication Configuration

Seeklit uses OpenID Connect (OIDC) for authentication.

## Authentication Method

### OIDC Only (`oidc`)

Uses OpenID Connect for authentication. Supports any OIDC-compliant provider (Keycloak, Auth0, Okta, etc.).

## Configuration

### In Configuration File (dev.conf/default.conf)

```ini
[auth]
# Authentication method: OIDC only
method=oidc

[oidc]
# OIDC Provider Configuration
issuer=https://your-oidc-provider.com
clientid=your-client-id
clientsecret=your-client-secret
redirecturl=http://localhost:8416/api/v1/auth/callback
```

### Environment Variables

Only these environment variables are used:

```bash
# Configuration file path (optional, defaults to /config/seeklit.conf)
SEEKLIT_CONF_FILE=dev.conf

# Application version (set during container build)
SEEKLIT_VERSION=develop
```

All other configuration is handled in the configuration file.

## API Endpoints

### Authentication Info

```
GET /api/v1/auth/info
```

Returns available authentication methods and configuration.

### OIDC Login

```
GET /api/v1/auth/login
```

Initiates OIDC login flow, redirects to provider.

### OIDC Callback

```
GET /api/v1/auth/callback?code=...&state=...
```

Handles OIDC callback and returns tokens.

### User Info

```
GET /api/v1/auth/userinfo
Authorization: Bearer <token>
```

Returns current user information from OIDC token.

### Logout

```
POST /api/v1/auth/logout
```

Clears session data.

## OIDC User Permissions

User permissions are determined from OIDC claims:

- **Admin roles/groups**: `admin`, `administrator`, `seeklit-admin`
- **Default permissions**: Download access, view all libraries and tags
- **Admin permissions**: Update, delete, upload access

The system checks both `roles` and `groups` claims for admin privileges.

## Important Notes

- **Audiobookshelf API Key**: While authentication is handled by OIDC, you still need to configure the `audiobookshelfapikey` in the `[general]` section for accessing Audiobookshelf data (user management, personalized search, etc.)
- **User Management**: User accounts are managed through your OIDC provider, not through Audiobookshelf

## Troubleshooting

- Check logs for authentication errors
- Verify OIDC provider configuration
- Ensure redirect URL matches exactly
- Test with `/api/v1/auth/info` endpoint
