'use client';

import { useState, useMemo, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import toast from 'react-hot-toast';

interface PermissionAction {
  key: string;
  action: string;
  label_ar: string;
  label_fr: string;
  label_en: string;
}

interface PermissionModule {
  module: string;
  label_ar: string;
  label_fr: string;
  label_en: string;
  actions: PermissionAction[];
}

interface Role {
  id: number;
  name: string;
  key: string;
  description: string | null;
  is_system: boolean;
  permission_keys: string[];
}

// Canonical action ordering across modules. Modules only emit columns they
// use; unused cells render as a dim em dash so the grid stays uniform.
const ACTION_COLUMNS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'import',
  'approve',
  'adjust',
  'transfer',
  'settle',
  'collect',
  'invite',
  'cost_prices',
] as const;
type ActionCol = (typeof ACTION_COLUMNS)[number];

function getModuleLabel(m: PermissionModule, locale: string): string {
  if (locale === 'ar') return m.label_ar || m.module;
  if (locale === 'fr') return m.label_fr || m.module;
  return m.label_en || m.module;
}

function getActionLabel(a: PermissionAction, locale: string): string {
  if (locale === 'ar') return a.label_ar || a.action;
  if (locale === 'fr') return a.label_fr || a.action;
  return a.label_en || a.action;
}

interface IndeterminateCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

function IndeterminateCheckbox({ indeterminate, ...rest }: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate && !rest.checked;
    }
  }, [indeterminate, rest.checked]);
  return <input ref={ref} type="checkbox" {...rest} />;
}

export default function RoleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const roleId = isNew ? null : Number(id);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useLocale();

  // ── Local form state ──────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────
  const { data: permData, isLoading: permLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await permissionsApi.getAll();
      return res.data;
    },
  });

  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['roles', roleId],
    queryFn: async () => {
      const res = await rolesApi.getOne(roleId!);
      return res.data;
    },
    enabled: !isNew && roleId !== null,
  });

  const role: Role | null = roleData?.data ?? null;
  const isSystem = !!role?.is_system;

  // Hydrate form once role + permissions are loaded.
  useEffect(() => {
    if (hydrated) return;
    if (isNew && permData) {
      setHydrated(true);
      return;
    }
    if (role && permData) {
      setName(role.name);
      setDescription(role.description ?? '');
      // Admin wildcard means "all". Expand it to every concrete key so the
      // grid renders fully checked (the user shouldn't see a half-empty grid
      // when they open the system Admin role).
      if (role.permission_keys.includes('*')) {
        const all = new Set<string>();
        (permData.data as PermissionModule[]).forEach((m) =>
          m.actions.forEach((a) => all.add(a.key))
        );
        setSelectedKeys(all);
      } else {
        setSelectedKeys(new Set(role.permission_keys));
      }
      setHydrated(true);
    }
  }, [hydrated, isNew, role, permData]);

  const modules: PermissionModule[] = permData?.data ?? [];

  // ── Save mutation ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        permission_keys: Array.from(selectedKeys),
      };
      if (isNew) {
        return rolesApi.create(payload);
      }
      return rolesApi.update(roleId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(isNew ? t('roles.createdSuccess') : t('roles.savedSuccess'));
      router.push('/dashboard/roles');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('roles.savedSuccess'));
    },
  });

  // ── Toggle handlers ──────────────────────────────────────────────
  const toggleKey = (key: string) => {
    if (isSystem) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const moduleState = useMemo(() => {
    const map: Record<string, { all: boolean; some: boolean; total: number; checked: number }> = {};
    modules.forEach((m) => {
      const total = m.actions.length;
      const checked = m.actions.filter((a) => selectedKeys.has(a.key)).length;
      map[m.module] = {
        all: total > 0 && checked === total,
        some: checked > 0 && checked < total,
        total,
        checked,
      };
    });
    return map;
  }, [modules, selectedKeys]);

  const toggleModule = (m: PermissionModule) => {
    if (isSystem) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const allChecked = m.actions.every((a) => next.has(a.key));
      if (allChecked) {
        m.actions.forEach((a) => next.delete(a.key));
      } else {
        m.actions.forEach((a) => next.add(a.key));
      }
      return next;
    });
  };

  // Only show columns that at least one module uses, in canonical order.
  const visibleColumns: ActionCol[] = useMemo(() => {
    const present = new Set<string>();
    modules.forEach((m) => m.actions.forEach((a) => present.add(a.action)));
    return ACTION_COLUMNS.filter((c) => present.has(c));
  }, [modules]);

  const isLoading = permLoading || (!isNew && roleLoading);

  const breadcrumb = [
    { label: t('roles.title'), href: '/dashboard/roles' },
    { label: isNew ? t('roles.addRole') : role?.name ?? '' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={isNew ? t('roles.addRole') : role?.name ?? t('roles.editRole')}
        subtitle={isSystem ? t('roles.readOnlyNotice') : t('roles.subtitle')}
        breadcrumb={breadcrumb}
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard/roles')}
          className="btn btn-secondary"
        >
          {t('roles.cancel')}
        </button>
        {!isSystem && (
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name.trim()}
            className="btn btn-primary"
          >
            {saveMutation.isPending ? t('roles.saving') : t('roles.save')}
          </button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="surface-pro p-8 text-center text-gray-400">
          <span className="spinner inline-block"></span>
        </div>
      ) : (
        <>
          {/* Name + description tile */}
          <div className="surface-pro p-4 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('roles.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSystem}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('roles.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSystem}
                rows={2}
                className="input"
              />
            </div>
          </div>

          {/* Permission grid */}
          <div className="surface-pro overflow-x-auto">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t('roles.module')}</th>
                  <th className="text-center">{t('roles.allInRow')}</th>
                  {visibleColumns.map((col) => {
                    // Use the first action with this name for its localized label;
                    // it's the same label everywhere by backend convention.
                    let label: string = col;
                    for (const m of modules) {
                      const a = m.actions.find((x) => x.action === col);
                      if (a) {
                        label = getActionLabel(a, locale);
                        break;
                      }
                    }
                    return (
                      <th key={col} className="text-center">
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const state = moduleState[m.module] || {
                    all: false,
                    some: false,
                    total: 0,
                    checked: 0,
                  };
                  return (
                    <tr key={m.module}>
                      <td className="t-strong">{getModuleLabel(m, locale)}</td>
                      <td className="text-center">
                        <IndeterminateCheckbox
                          checked={state.all}
                          indeterminate={state.some}
                          disabled={isSystem}
                          onChange={() => toggleModule(m)}
                        />
                      </td>
                      {visibleColumns.map((col) => {
                        const action = m.actions.find((a) => a.action === col);
                        if (!action) {
                          return (
                            <td key={col} className="text-center text-gray-300 dark:text-gray-600">
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={col} className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(action.key)}
                              onChange={() => toggleKey(action.key)}
                              disabled={isSystem}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
