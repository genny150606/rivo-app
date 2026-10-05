/**
 * RIVO Role-Based Access Control (RBAC) Module
 * 
 * Defines roles, granular permissions, role hierarchies,
 * and authorization helpers for multi-tenant staff management.
 */

export type StaffRole = 'owner' | 'manager' | 'waiter' | 'employee';
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
  | 'organization.settings'
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'inventory.view'
  | 'inventory.update'
  | 'inventory.movements'
  | 'sales.view'
  | 'sales.create'
  | 'sales.refund'
  | 'customers.view'
  | 'customers.create'
  | 'customers.update'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.update'
  | 'reports.view';

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario / Titolare',
  client: 'Proprietario / Titolare', // Backward compatibility for existing client profiles
  manager: 'Store / Floor Manager',
  employee: 'Operatore Cassa & Vendite',
  waiter: 'Cameriere di Sala',
  admin: 'Amministratore RIVO',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'Controllo completo su catalogo, cassa, magazzino, fornitori, staff, sedi e impostazioni.',
  manager: 'Gestione operativa di cassa, magazzino, inventario, ordini, staff e report di vendita.',
  employee: 'Accesso operativo a vendite, consultazione prodotti, carico cassa e anagrafica clienti.',
  waiter: 'Gestione rapida dei propri tavoli assegnati, presa comande e chiamate servizio.',
};

const ALL_PERMISSIONS: AppPermission[] = [
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
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'inventory.view',
  'inventory.update',
  'inventory.movements',
  'sales.view',
  'sales.create',
  'sales.refund',
  'customers.view',
  'customers.create',
  'customers.update',
  'suppliers.view',
  'suppliers.create',
  'suppliers.update',
  'reports.view',
];

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: ALL_PERMISSIONS,
  owner: ALL_PERMISSIONS,
  client: ALL_PERMISSIONS,
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
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'inventory.view',
    'inventory.update',
    'inventory.movements',
    'sales.view',
    'sales.create',
    'sales.refund',
    'customers.view',
    'customers.create',
    'customers.update',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'reports.view',
  ],
  employee: [
    'products.view',
    'inventory.view',
    'sales.view',
    'sales.create',
    'customers.view',
    'customers.create',
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
