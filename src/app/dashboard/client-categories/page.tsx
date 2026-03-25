'use client';

import { useState, useEffect } from 'react';
import { clientCategoriesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TagIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface ClientCategory {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  clients_count?: number;
}

export default function ClientCategoriesPage() {
  const { t, locale } = useLocale();
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (error: any) {
      const message = error.response?.data?.message || t('clientCategories.deleteError');
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('clientCategories.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('clientCategories.subtitle')}</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <PlusIcon className="w-5 h-5" />
          {t('clientCategories.addCategory')}
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <TagIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>{t('clientCategories.noCategories')}</p>
            <button onClick={handleOpenCreate} className="mt-3 text-blue-600 dark:text-blue-400 hover:underline">
              {t('clientCategories.addNewCategory')}
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{category.name}</h3>
                      {category.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          <CheckCircleIcon className="w-3 h-3" />
                          {t('clientCategories.sellingPrice')}
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{t('clientCategories.clientCount', { count: category.clients_count ?? 0 })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                    title={t('clientCategories.edit')}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsDeleteOpen(true);
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title={t('clientCategories.delete')}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold dark:text-white">
                {selectedCategory ? t('clientCategories.editCategory') : t('clientCategories.addCategoryTitle')}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">{t('clientCategories.deleteCategory')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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
              <div className="flex gap-3 justify-center">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
