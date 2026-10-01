import { NextResponse } from 'next/server';
import { ModuleSlug, MODULE_CATALOG } from './catalog';
import { isModuleActive } from './resolver';

/**
 * Server guard for Route Handlers and Server Actions.
 * Returns null if allowed, or NextResponse 403 Forbidden with details if module is disabled.
 */
export async function guardModuleAccess(
  organizationId: string,
  requiredModule: ModuleSlug
): Promise<NextResponse | null> {
  const active = await isModuleActive(organizationId, requiredModule);
  if (!active) {
    const modDef = MODULE_CATALOG[requiredModule];
    return NextResponse.json(
      {
        error: `Modulo non attivo: ${modDef?.name || requiredModule}`,
        code: 'MODULE_DISABLED',
        module: requiredModule
      },
      { status: 403 }
    );
  }
  return null;
}
