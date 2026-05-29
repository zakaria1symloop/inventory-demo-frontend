'use client';

import { useState, useEffect } from 'react';
import { brandsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Brand {
  id: number;
  name: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLocale();

  useEffect(() => {
    fetchBrands();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingBrand(null);
        setFormData({ name: '', is_active: true });
        setShowModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await brandsApi.getAll();
      setBrands(response.data.data || response.data);
    } catch (error) {
      toast.error(t('common.loadError', { item: t('stock.brandsTitle') }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingBrand) {
        await brandsApi.update(editingBrand.id, formData);
        toast.success(t('common.updatedSuccess', { item: t('stock.brandFull') }));
      } else {
        await brandsApi.create(formData);
        toast.success(t('common.addedSuccess', { item: t('stock.brandFull') }));
      }
      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', is_active: true });
      fetchBrands();
    } catch (error) {
      toast.error(t('common.saveError', { item: t('stock.brandFull') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, is_active: brand.is_active });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('stock.confirmDeleteBrand'))) return;

    try {
      await brandsApi.delete(id);
      toast.success(t('common.deletedSuccess', { item: t('stock.brandFull') }));
      fetchBrands();
    } catch (error) {
      toast.error(t('common.deleteError', { item: t('stock.brandFull') }));
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('stock.brandsTitle')}>
        <button
          onClick={() => {
            setEditingBrand(null);
            setFormData({ name: '', is_active: true });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('stock.addBrand')}
          <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
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
              <th>{t('common.name')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  {t('stock.noBrands')}
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand, index) => (
                <tr key={brand.id}>
                  <td className="tnum">{index + 1}</td>
                  <td className="font-medium">{brand.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${brand.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                      {brand.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
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

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingBrand ? t('stock.editBrand') : t('stock.addBrand')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('common.name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.active')}</span>
                    </label>
                  </div>
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? t('common.saving') : t('common.save')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
