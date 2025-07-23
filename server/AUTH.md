# Authentication Configuration

Seeklit now supports flexible authentication with three modes:

## Authentication Methods

### 1. Audiobookshelf Only (`audiobookshelf`)

Uses your existing Audiobookshelf server for authentication. Tokens are validated against the Audiobookshelf API.

### 2. OIDC Only (`oidc`)

Uses OpenID Connect for authentication. Supports any OIDC-compliant provider (Keycloak, Auth0, Okta, etc.).

### 3. Both (`both`)

Tries OIDC first, then falls back to Audiobookshelf if OIDC validation fails. This allows for a gradual migration.

## Configuration

### In Configuration File (dev.conf/default.conf)

```ini
[auth]
# Authentication method: "audiobookshelf", "oidc", or "both"
method=both

[audiobookshelf]
# Audiobookshelf server URL for authentication
url=http://audiobookshelf:80

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

### OIDC Login (when OIDC is enabled)

```
GET /api/v1/auth/login
```

Initiates OIDC login flow, redirects to provider.

### OIDC Callback (when OIDC is enabled)

```
GET /api/v1/auth/callback?code=...&state=...
```

Handles OIDC callback and returns tokens.

### User Info

```
GET /api/v1/auth/userinfo
Authorization: Bearer <token>
```

Returns current user information (works with both auth methods).

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

## Migration Strategy

1. **Start with `audiobookshelf`**: Keep existing setup
2. **Configure OIDC**: Add OIDC settings to config
3. **Switch to `both`**: Allow both authentication methods
4. **Test OIDC**: Verify OIDC authentication works
5. **Switch to `oidc`**: Use only OIDC authentication

## Troubleshooting

- Check logs for authentication errors
- Verify OIDC provider configuration
- Ensure redirect URL matches exactly
- Test with `/api/v1/auth/info` endpoint
