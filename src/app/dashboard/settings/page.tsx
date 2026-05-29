'use client';

import { useState, useEffect, useRef } from 'react';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { SunIcon, MoonIcon, PhotoIcon, TrashIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';

export default function SettingsPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    // Company Info
    company_name: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    company_rc: '',
    company_nif: '',
    company_ai: '',
    company_nis: '',
    company_rib: '',
    company_logo: '',
    // General
    currency: 'DZD',
    tax_rate: '19',
    low_stock_alert: '10',
    // Order management
    auto_validate_orders: 'false',
    // Seller visibility
    seller_see_all_clients: 'false',
    // Invoice
    invoice_prefix_sale: 'VNT-',
    invoice_prefix_purchase: 'ACH-',
    invoice_show_logo: 'true',
    invoice_show_company: 'true',
    // Theme
    theme: 'light',
  });

  const [darkMode, setDarkMode] = useState(false);

  // Password management state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Backup state
  const [isExportingSql, setIsExportingSql] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<string>('');
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkPasswordProtection();
    // Check localStorage for dark mode
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const checkPasswordProtection = async () => {
    try {
      const response = await settingsApi.hasPassword();
      const hasPass = response.data.has_password;
      setHasPassword(hasPass);
      if (!hasPass) {
        setIsUnlocked(true);
        fetchSettings();
      }
    } catch (error) {
      console.error('Error checking password:', error);
      // If error, assume no password and unlock
      setIsUnlocked(true);
      fetchSettings();
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      toast.error(t('settings.pleaseEnterPassword'));
      return;
    }

    setIsVerifying(true);
    try {
      const response = await settingsApi.verifyPassword(passwordInput);
      if (response.data.verified) {
        setIsUnlocked(true);
        fetchSettings();
        toast.success(t('settings.verifiedSuccess'));
      }
    } catch (error) {
      toast.error(t('settings.wrongPassword'));
    } finally {
      setIsVerifying(false);
      setPasswordInput('');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      const data = response.data;
      const safeData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v ?? ''])
      );
      setSettings(prev => ({
        ...prev,
        ...safeData,
      }));
      if (data.company_logo) {
        setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${data.company_logo}`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await settingsApi.uploadLogo(formData);
      setSettings(prev => ({ ...prev, company_logo: response.data.path }));
      toast.success(t('settings.logoUploadSuccess'));
    } catch (error) {
      toast.error(t('settings.logoUploadError'));
      setLogoPreview(null);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await settingsApi.deleteLogo();
      setLogoPreview(null);
      setSettings(prev => ({ ...prev, company_logo: '' }));
      toast.success(t('settings.logoDeleteSuccess'));
    } catch (error) {
      toast.error(t('settings.logoDeleteError'));
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    setSettings(prev => ({ ...prev, theme: newMode ? 'dark' : 'light' }));
    // Dispatch storage event for other components
    window.dispatchEvent(new StorageEvent('storage', { key: 'darkMode', newValue: newMode ? 'true' : 'false' }));
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (newPassword.length < 4) {
      toast.error(t('settings.passwordMinLength'));
      return;
    }

    setIsSettingPassword(true);
    try {
      await settingsApi.setPassword({
        current_password: hasPassword ? currentPassword : undefined,
        new_password: newPassword,
      });
      toast.success(t('settings.passwordUpdateSuccess'));
      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(t('settings.passwordUpdateError'));
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!currentPassword) {
      toast.error(t('settings.enterCurrentPassword'));
      return;
    }

    if (!confirm(t('settings.confirmRemoveProtection'))) return;

    setIsSettingPassword(true);
    try {
      await settingsApi.removePassword(currentPassword);
      toast.success(t('settings.passwordRemovedSuccess'));
      setHasPassword(false);
      setCurrentPassword('');
    } catch (error) {
      toast.error(t('settings.wrongPassword'));
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Backup handlers
  const handleExportSql = async () => {
    setIsExportingSql(true);
    try {
      const response = await settingsApi.exportSql();
      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('settings.exportSqlSuccess'));
    } catch {
      toast.error(t('settings.exportSqlError'));
    } finally {
      setIsExportingSql(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await settingsApi.createBackup();
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.rbk`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('settings.backupSuccess'));
    } catch {
      toast.error(t('settings.backupError'));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.rbk')) {
      toast.error(t('settings.invalidFileFormat'));
      return;
    }

    setRestoreFile(file);
    setRestoreProgress(t('settings.readingBackupInfo'));

    try {
      const response = await settingsApi.getBackupInfo(file);
      setBackupInfo(response.data.metadata);
      setShowRestoreConfirm(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('settings.invalidFile'));
      setRestoreFile(null);
    } finally {
      setRestoreProgress('');
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreFile) return;

    setIsRestoringBackup(true);
    setRestoreProgress(t('settings.restoringBackup'));
    setShowRestoreConfirm(false);

    try {
      await settingsApi.restoreBackup(restoreFile);
      toast.success(t('settings.restoreSuccess'));
      fetchSettings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('settings.restoreFailed'));
    } finally {
      setIsRestoringBackup(false);
      setRestoreProgress('');
      setRestoreFile(null);
      setBackupInfo(null);
      if (backupFileInputRef.current) {
        backupFileInputRef.current.value = '';
      }
    }
  };

  const handleCancelRestore = () => {
    setShowRestoreConfirm(false);
    setRestoreFile(null);
    setBackupInfo(null);
    if (backupFileInputRef.current) {
      backupFileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'company', name: t('settings.tabCompany'), icon: '🏢' },
    { id: 'legal', name: t('settings.tabLegal'), icon: '📋' },
    { id: 'general', name: t('settings.tabGeneral'), icon: '⚙️' },
    { id: 'invoice', name: t('settings.tabInvoice'), icon: '📄' },
    { id: 'appearance', name: t('settings.tabAppearance'), icon: '🎨' },
    { id: 'security', name: t('settings.tabSecurity'), icon: '🔒' },
    { id: 'backup', name: t('settings.tabBackup'), icon: '💾' },
  ];

  // Show loading while checking password
  if (isCheckingPassword) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show password prompt if not unlocked
  if (!isUnlocked && hasPassword) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="surface-pro p-6 w-full max-w-md">
          <div className="text-center mb-5">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <LockClosedIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </div>
            <h1 className="text-[18px] font-semibold text-gray-900 dark:text-white">{t('settings.settingsProtected')}</h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{t('settings.enterPasswordAccess')}</p>
          </div>

          <form onSubmit={handleVerifyPassword}>
            <div className="mb-3">
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('settings.passwordLabel')}
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="input w-full"
                placeholder={t('settings.passwordPlaceholder')}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full inline-flex items-center justify-center gap-2 px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  {t('settings.verifying')}
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  {t('settings.enter')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        subtitle={isRTL ? 'ادارة اعدادات التطبيق والتفضيلات' : 'Gerez les parametres et preferences de votre application'}
      >
        <button
          onClick={toggleDarkMode}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? t('settings.lightMode') : t('settings.darkMode')}
        >
          {darkMode ? (
            <SunIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="surface-pro overflow-hidden p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13px] ${
                  isRTL ? 'text-right' : 'text-left'
                } ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="surface-pro p-5">
            {activeTab === 'company' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.companyInfo')}</h2>

                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.companyLogo')}</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden bg-white dark:bg-gray-800"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        {t('settings.uploadLogo')}
                      </button>
                      {logoPreview && (
                        <button
                          onClick={handleDeleteLogo}
                          className="inline-flex items-center gap-2 px-3 h-[32px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          {t('settings.deleteLogo')}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('settings.logoMaxSize')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.companyName')}</label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      className="input"
                      placeholder="TrackSera"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.phone')}</label>
                      <input
                        type="tel"
                        value={settings.company_phone}
                        onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="0555 123 456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.email')}</label>
                      <input
                        type="email"
                        value={settings.company_email}
                        onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="info@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.address')}</label>
                    <textarea
                      value={settings.company_address}
                      onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder={isRTL ? 'بسكرة، الجزائر' : 'Biskra, Algerie'}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.legalInfo')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.legalInfoDesc')}</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.rc')}
                      </label>
                      <input
                        type="text"
                        value={settings.company_rc}
                        onChange={(e) => setSettings({ ...settings, company_rc: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="00/00-0000000B00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.nif')}
                      </label>
                      <input
                        type="text"
                        value={settings.company_nif}
                        onChange={(e) => setSettings({ ...settings, company_nif: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="000000000000000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.ai')}
                      </label>
                      <input
                        type="text"
                        value={settings.company_ai}
                        onChange={(e) => setSettings({ ...settings, company_ai: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="00000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.nis')}
                      </label>
                      <input
                        type="text"
                        value={settings.company_nis}
                        onChange={(e) => setSettings({ ...settings, company_nis: e.target.value })}
                        className="input"
                        dir="ltr"
                        placeholder="000000000000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.rib')}
                    </label>
                    <input
                      type="text"
                      value={settings.company_rib}
                      onChange={(e) => setSettings({ ...settings, company_rib: e.target.value })}
                      className="input"
                      dir="ltr"
                      placeholder="00000 00000 00000000000 00"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.generalSettings')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.currency')}</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="select"
                    >
                      <option value="DZD">{t('settings.currencyDZD')}</option>
                      <option value="USD">{t('settings.currencyUSD')}</option>
                      <option value="EUR">{t('settings.currencyEUR')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.taxRate')}</label>
                    <input
                      type="number"
                      value={settings.tax_rate}
                      onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.lowStockAlert')}</label>
                    <input
                      type="number"
                      value={settings.low_stock_alert}
                      onChange={(e) => setSettings({ ...settings, low_stock_alert: e.target.value })}
                      className="input"
                    />
                  </div>

                  {/* Auto-validate Orders Setting */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="surface-heading mb-2 flex items-center gap-2">
                      {t('settings.autoValidateOrders')}
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300"><span className="metric-dot metric-dot-green" aria-hidden />{t('settings.new')}</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('settings.autoValidateDesc')}</p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, auto_validate_orders: 'false' })}
                        className={`flex-1 p-3 rounded-md border transition-colors cursor-pointer ${settings.auto_validate_orders === 'false' ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">{t('settings.manualApproval')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.manualApprovalDesc')}</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, auto_validate_orders: 'true' })}
                        className={`flex-1 p-3 rounded-md border transition-colors cursor-pointer ${settings.auto_validate_orders === 'true' ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">{t('settings.autoApproval')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.autoApprovalDesc')}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Seller Client Visibility Setting */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="surface-heading mb-2 flex items-center gap-2">
                      {t('settings.sellerVisibility')}
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300"><span className="metric-dot metric-dot-green" aria-hidden />{t('settings.new')}</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('settings.sellerVisibilityDesc')}</p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, seller_see_all_clients: 'false' })}
                        className={`flex-1 p-3 rounded-md border transition-colors cursor-pointer ${settings.seller_see_all_clients === 'false' ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">{t('settings.ownClientsOnly')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.ownClientsOnlyDesc')}</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, seller_see_all_clients: 'true' })}
                        className={`flex-1 p-3 rounded-md border transition-colors cursor-pointer ${settings.seller_see_all_clients === 'true' ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">{t('settings.allClients')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.allClientsDesc')}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.invoiceSettings')}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.salesInvoicePrefix')}</label>
                      <input
                        type="text"
                        value={settings.invoice_prefix_sale}
                        onChange={(e) => setSettings({ ...settings, invoice_prefix_sale: e.target.value })}
                        className="input"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.purchaseInvoicePrefix')}</label>
                      <input
                        type="text"
                        value={settings.invoice_prefix_purchase}
                        onChange={(e) => setSettings({ ...settings, invoice_prefix_purchase: e.target.value })}
                        className="input"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.invoice_show_logo === 'true'}
                        onChange={(e) => setSettings({ ...settings, invoice_show_logo: e.target.checked ? 'true' : 'false' })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.showLogoOnInvoice')}</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.invoice_show_company === 'true'}
                        onChange={(e) => setSettings({ ...settings, invoice_show_company: e.target.checked ? 'true' : 'false' })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.showCompanyOnInvoice')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.appearance')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{t('settings.chooseTheme')}</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setDarkMode(false);
                          document.documentElement.classList.remove('dark');
                          localStorage.setItem('darkMode', 'false');
                          window.dispatchEvent(new StorageEvent('storage', { key: 'darkMode', newValue: 'false' }));
                        }}
                        className={`flex-1 p-4 rounded-md border flex flex-col items-center gap-2 transition-colors ${
                          !darkMode ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <SunIcon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
                        <span className="font-medium text-gray-900 dark:text-white">{t('settings.lightMode')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setDarkMode(true);
                          document.documentElement.classList.add('dark');
                          localStorage.setItem('darkMode', 'true');
                          window.dispatchEvent(new StorageEvent('storage', { key: 'darkMode', newValue: 'true' }));
                        }}
                        className={`flex-1 p-4 rounded-md border flex flex-col items-center gap-2 transition-colors ${
                          darkMode ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <MoonIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white">{t('settings.darkMode')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.securitySettings')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t('settings.securityDesc')}
                </p>

                <div className="surface-pro p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <LockClosedIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {hasPassword ? t('settings.protectionEnabled') : t('settings.protectionDisabled')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hasPassword ? t('settings.protectionEnabledDesc') : t('settings.protectionDisabledDesc')}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSetPassword} className="space-y-4">
                    {hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.currentPassword')}
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input"
                          placeholder={t('settings.currentPasswordPlaceholder')}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {hasPassword ? t('settings.newPassword') : t('settings.setPassword')}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input"
                        placeholder={t('settings.newPasswordPlaceholder')}
                        minLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.confirmPassword')}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input"
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                        minLength={4}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSettingPassword || !newPassword || !confirmPassword}
                        className="inline-flex items-center gap-2 px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                      >
                        {isSettingPassword ? (
                          <>
                            <div className="spinner w-5 h-5"></div>
                            {t('settings.saving')}
                          </>
                        ) : (
                          <>
                            <LockClosedIcon className="w-5 h-5" />
                            {hasPassword ? t('settings.updatePassword') : t('settings.enableProtection')}
                          </>
                        )}
                      </button>

                      {hasPassword && (
                        <button
                          type="button"
                          onClick={handleRemovePassword}
                          disabled={isSettingPassword || !currentPassword}
                          className="inline-flex items-center gap-2 px-4 h-[36px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-5 h-5" />
                          {t('settings.removeProtection')}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div>
                <h2 className="surface-heading mb-4">{t('settings.backupAndRestore')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t('settings.backupDesc')}
                </p>

                {/* Create Backup Section */}
                <div className="surface-pro p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.createBackup')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.createBackupDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="inline-flex items-center gap-2 px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {isCreatingBackup ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        {t('settings.creatingBackup')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('settings.createAndDownloadBackup')}
                      </>
                    )}
                  </button>
                </div>

                {/* Export SQL Section */}
                <div className="surface-pro p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.exportSql')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.exportSqlDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportSql}
                    disabled={isExportingSql}
                    className="inline-flex items-center gap-2 px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {isExportingSql ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        {t('settings.exportingSql')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        {t('settings.exportSqlButton')}
                      </>
                    )}
                  </button>
                </div>

                {/* Restore Backup Section */}
                <div className="surface-pro p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L16 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.restoreBackup')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.restoreBackupDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200/80 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 p-3 mb-4">
                    <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium inline-flex items-center gap-1.5">
                      <span className="metric-dot metric-dot-red" aria-hidden />
                      {t('settings.restoreWarning')}
                    </p>
                  </div>

                  <input
                    ref={backupFileInputRef}
                    type="file"
                    accept=".rbk"
                    onChange={handleRestoreFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => backupFileInputRef.current?.click()}
                    disabled={isRestoringBackup}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isRestoringBackup ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        {restoreProgress || t('settings.restoring')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L16 8m4-4v12" />
                        </svg>
                        {t('settings.selectBackupFile')}
                      </>
                    )}
                  </button>

                  {restoreProgress && !isRestoringBackup && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{restoreProgress}</p>
                  )}
                </div>

                {/* Restore Confirmation Modal */}
                {showRestoreConfirm && backupInfo && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200/80 dark:border-gray-700 p-5 max-w-md w-full">
                      <h3 className="surface-heading mb-3">{t('settings.confirmRestore')}</h3>

                      <div className="rounded-md border border-gray-200/80 dark:border-gray-700 p-3 mb-3 text-[13px] space-y-1">
                        <p className="text-gray-700 dark:text-gray-300"><strong>{t('settings.backupDate')}</strong> {new Date(backupInfo.created_at).toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ')}</p>
                        <p className="text-gray-700 dark:text-gray-300"><strong>{t('settings.createdBy')}</strong> {backupInfo.created_by}</p>
                        <p className="text-gray-700 dark:text-gray-300"><strong>{t('settings.version')}</strong> {backupInfo.version}</p>
                        {backupInfo.table_counts && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>{t('settings.tablesCount')}</strong> {Object.keys(backupInfo.table_counts).length}
                          </p>
                        )}
                      </div>

                      <div className="rounded-md border border-gray-200/80 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 p-3 mb-4">
                        <p className="text-[13px] text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5">
                          <span className="metric-dot metric-dot-red" aria-hidden />
                          {t('settings.confirmRestoreWarning')}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button onClick={handleCancelRestore} className="px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                          {t('settings.cancel')}
                        </button>
                        <button onClick={handleConfirmRestore} className="px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors">
                          {t('settings.confirmRestoreButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'security' && activeTab !== 'backup' && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="spinner w-5 h-5"></div>
                      {t('settings.saving')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('settings.saveSettings')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
