/**
 * RIVO Role-Based Access Control (RBAC) Module
 * 
 * Defines roles, granular permissions, role hierarchies,
 * and authorization helpers for multi-tenant staff management.
 */

export type StaffRole = 'owner' | 'manager' | 'waiter';
export type AppRole = StaffRole | 'admin' | 'client';

export type AppPermission =
  | 'staff.view'
  | 'staff.create'
  | 'staff.update'
  | 'staff.disable'
  | 'tables.view'
  | 'tables.assign'
  | 'tables.take'
  | 'orders.view'
  | 'orders.manage'
  | 'menu.view'
  | 'menu.edit'
  | 'analytics.view'
  | 'tips.view'
  | 'organization.settings';

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario',
  client: 'Proprietario', // Backward compatibility for existing client profiles
  manager: 'Manager di Sala',
  waiter: 'Cameriere',
  admin: 'Amministratore RIVO',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'Controllo completo su staff, sedi, tavoli, menu, analytics e impostazioni del ristorante.',
  manager: 'Gestione sala e staff, assegnazione tavoli, monitor ordini e chiamate, analytics operativi.',
  waiter: 'Gestione rapida dei propri tavoli assegnati, presa tavoli liberi, gestione comande e chiamate.',
};

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: [
    'staff.view',
    'staff.create',
    'staff.update',
    'staff.disable',
    'tables.view',
    'tables.assign',
    'tables.take',
    'orders.view',
    'orders.manage',
    'menu.view',
    'menu.edit',
    'analytics.view',
    'tips.view',
    'organization.settings',
  ],
  owner: [
    'staff.view',
    'staff.create',
    'staff.update',
    'staff.disable',
    'tables.view',
    'tables.assign',
    'tables.take',
    'orders.view',
    'orders.manage',
    'menu.view',
    'menu.edit',
    'analytics.view',
    'tips.view',
    'organization.settings',
  ],
  client: [
    // Existing accounts with role = 'client' have owner privileges
    'staff.view',
    'staff.create',
    'staff.update',
    'staff.disable',
    'tables.view',
    'tables.assign',
    'tables.take',
    'orders.view',
    'orders.manage',
    'menu.view',
    'menu.edit',
    'analytics.view',
    'tips.view',
    'organization.settings',
  ],
  manager: [
    'staff.view',
    'staff.create',
    'tables.view',
    'tables.assign',
    'tables.take',
    'orders.view',
    'orders.manage',
    'menu.view',
    'menu.edit',
    'analytics.view',
    'tips.view',
  ],
  waiter: [
    'tables.view',
    'tables.take',
    'orders.view',
    'orders.manage',
    'tips.view',
  ],
};

/**
 * Normalizes user role ensuring backward compatibility ('client' -> treated as 'owner')
 */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return 'waiter';
  const clean = role.toLowerCase().trim();
  if (clean === 'client' || clean === 'owner') return 'owner';
  if (clean === 'manager') return 'manager';
  if (clean === 'waiter') return 'waiter';
  if (clean === 'admin') return 'admin';
  return 'waiter';
}

/**
 * Checks whether a given role (with optional custom permissions override) possesses a permission
 */
export function hasPermission(
  role: string | null | undefined,
  permission: AppPermission,
  customPermissions?: string[] | null
): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  if (normalized === 'admin' || normalized === 'owner') return true;

  // Check custom permission override first if present
  if (Array.isArray(customPermissions) && customPermissions.includes(permission)) {
    return true;
  }

  const basePermissions = ROLE_PERMISSIONS[normalized] || [];
  return basePermissions.includes(permission);
}

/**
 * Checks whether a profile object can perform an action
 */
export function can(
  profile: { role?: string | null; permissions?: string[] | null; status?: string | null } | null | undefined,
  permission: AppPermission
): boolean {
  if (!profile) return false;
  if (profile.status === 'suspended' || profile.status === 'deactivated') {
    return false;
  }
  return hasPermission(profile.role, permission, profile.permissions);
}
