'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Category } from '@/lib/types';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';

export default function CategoriesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    is_active: true,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      const response = await categoriesApi.getAll({ search });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.addedSuccess', { item: t('stock.category') }));
      handleCloseModal();
    },
    onError: () => toast.error(t('common.errorAdd')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.updatedSuccess', { item: t('stock.category') }));
      handleCloseModal();
    },
    onError: () => toast.error(t('common.errorUpdate')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.deletedSuccess', { item: t('stock.category') }));
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    },
    onError: () => toast.error(t('common.errorDelete')),
  });

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', parent_id: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id?.toString() || '',
      is_active: category.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      is_active: formData.is_active,
    };

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const allCategories = (categories as Category[]) || [];
  const parentCategories = allCategories.filter((c) => !c.parent_id);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleOpenCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title={t('stock.categoriesTitle')} subtitle={t('stock.categoriesSubtitle')}>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('stock.addCategory')}
          <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
        </button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('stock.searchCategory')}
      />

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">#</th>
              <th>{t('common.name')}</th>
              <th>{t('stock.parentCategory')}</th>
              <th className="text-end">{t('stock.productsCount')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  <span className="spinner inline-block" />
                </td>
              </tr>
            ) : allCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {t('stock.noCategories')}
                </td>
              </tr>
            ) : (
              allCategories.map((item, index) => (
                <tr key={item.id}>
                  <td className="tnum">{index + 1}</td>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.parent?.name || '-'}</td>
                  <td className="tnum">{item.products_count || 0}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${item.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                      {item.is_active ? t('common.active') : t('common.disabled')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory(item);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? t('stock.editCategory') : t('stock.addNewCategory')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.categoryName')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.parentCategory')}</label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData((p) => ({ ...p, parent_id: e.target.value }))}
              className="select"
            >
              <option value="">{t('stock.noParent')}</option>
              {parentCategories
                .filter((c) => c.id !== selectedCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">{t('stock.activeCategory')}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : selectedCategory ? (
                t('common.update')
              ) : (
                t('common.add')
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
        title={t('stock.deleteCategory')}
        message={t('common.confirmDeleteMsg', { name: selectedCategory?.name || '' })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
