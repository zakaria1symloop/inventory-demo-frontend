'use client';

import { useAuthStore } from './store/auth';

/**
 * Permission helpers backed by the auth store.
 *
 * The backend `/api/user` response carries a `permission_keys: string[]`
 * field on the user object. Admins receive `['*']` (a single wildcard
 * sentinel) which grants every permission across the app.
 *
 *   const canCreateSale = usePermission('sales.create');
 *   const { has, keys } = usePermissions();
 *   if (has('roles.view')) { ... }
 */

function hasKey(keys: string[] | undefined, key: string): boolean {
  if (!keys || keys.length === 0) return false;
  if (keys.includes('*')) return true;
  return keys.includes(key);
}

export function usePermission(key: string): boolean {
  const user = useAuthStore((state) => state.user);
  return hasKey(user?.permission_keys, key);
}

export function usePermissions(): { has: (key: string) => boolean; keys: string[] } {
  const user = useAuthStore((state) => state.user);
  const keys = user?.permission_keys ?? [];
  return {
    has: (key: string) => hasKey(keys, key),
    keys,
  };
}
