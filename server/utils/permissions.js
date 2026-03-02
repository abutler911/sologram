// utils/permissions.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for role-based access control.
// Use in authorize() calls instead of magic string arrays.
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = {
  ADMIN: 'admin',
  CREATOR: 'creator',
  USER: 'user',
};

// Who can create content (posts, stories, etc.)
const CONTENT_CREATORS = [ROLES.ADMIN, ROLES.CREATOR];

// Who can access admin-only features
const ADMIN_ONLY = [ROLES.ADMIN];

// Who can engage (like, comment) — all authenticated users
const ENGAGERS = [ROLES.ADMIN, ROLES.CREATOR, ROLES.USER];

module.exports = { ROLES, CONTENT_CREATORS, ADMIN_ONLY, ENGAGERS };
