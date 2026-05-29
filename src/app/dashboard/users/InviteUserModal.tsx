'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { invitationApi, rolesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';

interface Role {
  id: number;
  name: string;
  is_system: boolean;
}

type Flow = 'direct' | 'magic_link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ isOpen, onClose }: Props) {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const [flow, setFlow] = useState<Flow>('direct');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  // Reset form whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setFlow('direct');
      setName('');
      setIdentifier('');
      setEmail('');
      setPassword('');
      setRoleId('');
      setAcceptUrl(null);
    }
  }, [isOpen]);

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await rolesApi.getAll();
      return res.data;
    },
    enabled: isOpen,
  });

  const roles: Role[] = rolesData?.data || [];

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> =
        flow === 'direct'
          ? { flow, name, identifier, password, role_id: roleId }
          : { flow, name, email, role_id: roleId };
      const res = await invitationApi.create(payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (flow === 'magic_link') {
        toast.success(t('users.inviteSent'));
        if (data?.accept_url) {
          setAcceptUrl(data.accept_url);
          return; // keep modal open so user can copy
        }
      } else {
        toast.success(t('users.userCreated'));
      }
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('users.toastCreateError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleId === '') return;
    mutation.mutate();
  };

  const handleCopy = async () => {
    if (!acceptUrl) return;
    try {
      await navigator.clipboard.writeText(acceptUrl);
      toast.success(t('users.copyAcceptUrl'));
    } catch {
      // ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.inviteUser')}>
      {acceptUrl ? (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-[12px] font-medium text-blue-800 dark:text-blue-300 mb-2">
              {t('users.inviteSent')}
            </p>
            <code className="block bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded p-2 text-[11px] text-gray-700 dark:text-gray-300 break-all">
              {acceptUrl}
            </code>
          </div>
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-2`}>
            <button type="button" onClick={handleCopy} className="btn btn-secondary">
              {t('users.copyAcceptUrl')}
            </button>
            <button type="button" onClick={onClose} className="btn btn-primary">
              {t('users.close')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Flow toggle */}
          <div className="inline-flex w-full p-1 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setFlow('direct')}
              className={`flex-1 px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${
                flow === 'direct'
                  ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('users.inviteDirect')}
            </button>
            <button
              type="button"
              onClick={() => setFlow('magic_link')}
              className={`flex-1 px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${
                flow === 'magic_link'
                  ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('users.inviteMagicLink')}
            </button>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('users.labelName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          {flow === 'direct' ? (
            <>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.identifier')}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input"
                  required
                />
                <p className="mt-1 text-[11px] text-gray-400">{t('users.inviteIdentifierHint')}</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.passwordForUser')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('users.inviteEmailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('users.role')}
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value === '' ? '' : Number(e.target.value))}
              className="select"
              required
            >
              <option value="">{t('users.labelRole')}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-2 pt-2`}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('users.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || roleId === ''}
              className="btn btn-primary"
            >
              {mutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : flow === 'direct' ? (
                t('users.createUser')
              ) : (
                t('users.sendInvite')
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
