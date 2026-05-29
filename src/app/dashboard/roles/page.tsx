'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  name: string;
  key: string;
  description: string | null;
  is_system: boolean;
  users_count: number;
  permission_keys: string[];
}

export default function RolesPage() {
  const { t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await rolesApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.deletedSuccess'));
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 403) {
        toast.error(t('roles.deleteSystemError'));
      } else if (err.response?.status === 409) {
        toast.error(t('roles.deleteAssignedError'));
      } else {
        toast.error(err.response?.data?.message || t('roles.deleteRole'));
      }
    },
  });

  const roles: Role[] = useMemo(() => {
    const list: Role[] = data?.data || [];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        (r.description ?? '').toLowerCase().includes(needle)
    );
  }, [data, search]);

  const handleDelete = (role: Role) => {
    if (role.is_system) {
      toast.error(t('roles.deleteSystemError'));
      return;
    }
    if (!confirm(t('roles.confirmDelete'))) return;
    deleteMutation.mutate(role.id);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('roles.title')} subtitle={t('roles.subtitle')}>
        <button
          onClick={() => router.push('/dashboard/roles/new')}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('roles.addRole')}
        </button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('roles.searchPlaceholder')}
      />

      <div className="surface-pro overflow-hidden">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('roles.name')}</th>
              <th>{t('roles.description')}</th>
              <th className="text-end tnum">{t('roles.usersCount')}</th>
              <th className="text-end tnum">{t('roles.permissionsCount')}</th>
              <th className="text-end">{t('users.thActions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  <span className="spinner inline-block"></span>
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  {t('roles.empty')}
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="t-strong">{role.name}</span>
                      {role.is_system && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                          <span className="metric-dot metric-dot-neutral" aria-hidden />
                          {t('roles.system')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="t-muted">{role.description || '-'}</td>
                  <td className="text-end tnum">{role.users_count}</td>
                  <td className="text-end tnum">
                    {role.permission_keys.includes('*') ? '*' : role.permission_keys.length}
                  </td>
                  <td className="text-end">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/dashboard/roles/${role.id}`}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label={t('roles.editRole')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      {!role.is_system && (
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          aria-label={t('roles.deleteRole')}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
