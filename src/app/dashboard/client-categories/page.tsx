'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clientCategoriesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface ClientCategory {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  clients_count?: number;
}

export default function ClientCategoriesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await clientCategoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error(t('clientCategories.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', is_default: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: ClientCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_default: category.is_default,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedCategory) {
        await clientCategoriesApi.update(selectedCategory.id, formData);
        toast.success(t('clientCategories.categoryUpdated'));
      } else {
        await clientCategoriesApi.create(formData);
        toast.success(t('clientCategories.categoryAdded'));
      }
      handleCloseModal();
      fetchCategories();
      queryClient.invalidateQueries({ queryKey: ['client-categories-list'] });
    } catch (error) {
      toast.error(t('clientCategories.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await clientCategoriesApi.delete(selectedCategory.id);
      toast.success(t('clientCategories.categoryDeleted'));
      setIsDeleteOpen(false);
      setSelectedCategory(null);
      fetchCategories();
      queryClient.invalidateQueries({ queryKey: ['client-categories-list'] });
    } catch (error: any) {
      const message = error.response?.data?.message || t('clientCategories.deleteError');
      toast.error(message);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('clientCategories.title')} subtitle={t('clientCategories.subtitle')}>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('clientCategories.addCategory')}
        </button>
      </PageHeader>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search')}
      />

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">#</th>
              <th>{t('clientCategories.categoryName')}</th>
              <th>{t('clientCategories.description')}</th>
              <th className="text-end">{t('dashboard.clients')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {t('clientCategories.noCategories')}
                </td>
              </tr>
            ) : (
              filtered.map((category, index) => (
                <tr key={category.id}>
                  <td className="tnum">{index + 1}</td>
                  <td className="font-medium">{category.name}</td>
                  <td className="text-gray-600 dark:text-gray-400">{category.description || '-'}</td>
                  <td className="tnum">{category.clients_count ?? 0}</td>
                  <td>
                    {category.is_default ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="metric-dot metric-dot-blue" aria-hidden />
                        {t('clientCategories.sellingPrice')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title={t('clientCategories.edit')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title={t('clientCategories.delete')}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {selectedCategory ? t('clientCategories.editCategory') : t('clientCategories.addCategoryTitle')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('clientCategories.categoryName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="input w-full"
                      required
                      placeholder={t('clientCategories.categoryNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('clientCategories.description')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                      className="input w-full"
                      placeholder={t('clientCategories.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={(e) => setFormData(p => ({ ...p, is_default: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('clientCategories.sellingPriceRetail')}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientCategories.sellingPriceDescription')}</p>
                      </div>
                    </label>
                  </div>
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                    {t('clientCategories.cancel')}
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? (
                      <>
                        <span className="spinner w-4 h-4"></span>
                        {t('clientCategories.saving')}
                      </>
                    ) : selectedCategory ? (
                      t('clientCategories.updateCategory')
                    ) : (
                      t('clientCategories.addCategoryBtn')
                    )}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selectedCategory && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsDeleteOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[440px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <main className="flex-1 overflow-y-auto p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{t('clientCategories.deleteCategory')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('clientCategories.deleteConfirm', { name: selectedCategory.name })}
                  {selectedCategory.is_default && (
                    <>
                      <br />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {t('clientCategories.deleteDefaultWarning')}
                      </span>
                    </>
                  )}
                  {!selectedCategory.is_default && (selectedCategory.clients_count ?? 0) > 0 && (
                    <>
                      <br />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {t('clientCategories.deleteLinkedWarning', { count: selectedCategory.clients_count ?? 0 })}
                      </span>
                    </>
                  )}
                </p>
              </main>
              <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('clientCategories.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={selectedCategory.is_default}
                  className={`btn ${selectedCategory.is_default ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  {t('clientCategories.confirmDelete')}
                </button>
              </footer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
