'use client';

import { useState, useEffect, useRef } from 'react';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { SunIcon, MoonIcon, PhotoIcon, TrashIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
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
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await settingsApi.verifyPassword(passwordInput);
      if (response.data.verified) {
        setIsUnlocked(true);
        fetchSettings();
        toast.success('تم التحقق بنجاح');
      }
    } catch (error) {
      toast.error('كلمة المرور غير صحيحة');
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
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('خطأ في حفظ الإعدادات');
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
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      toast.error('خطأ في رفع الشعار');
      setLogoPreview(null);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await settingsApi.deleteLogo();
      setLogoPreview(null);
      setSettings(prev => ({ ...prev, company_logo: '' }));
      toast.success('تم حذف الشعار');
    } catch (error) {
      toast.error('خطأ في حذف الشعار');
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
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    setIsSettingPassword(true);
    try {
      await settingsApi.setPassword({
        current_password: hasPassword ? currentPassword : undefined,
        new_password: newPassword,
      });
      toast.success('تم تحديث كلمة المرور بنجاح');
      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('خطأ في تحديث كلمة المرور');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!currentPassword) {
      toast.error('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    if (!confirm('هل أنت متأكد من إزالة حماية كلمة المرور؟')) return;

    setIsSettingPassword(true);
    try {
      await settingsApi.removePassword(currentPassword);
      toast.success('تم إزالة كلمة المرور');
      setHasPassword(false);
      setCurrentPassword('');
    } catch (error) {
      toast.error('كلمة المرور غير صحيحة');
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
      toast.success('تم تصدير قاعدة البيانات بنجاح');
    } catch {
      toast.error('خطأ في تصدير قاعدة البيانات');
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
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
    } catch {
      toast.error('خطأ في إنشاء النسخة الاحتياطية');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.rbk')) {
      toast.error('يرجى اختيار ملف بصيغة .rbk');
      return;
    }

    setRestoreFile(file);
    setRestoreProgress('جاري قراءة معلومات النسخة...');

    try {
      const response = await settingsApi.getBackupInfo(file);
      setBackupInfo(response.data.metadata);
      setShowRestoreConfirm(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'الملف غير صالح');
      setRestoreFile(null);
    } finally {
      setRestoreProgress('');
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreFile) return;

    setIsRestoringBackup(true);
    setRestoreProgress('جاري استعادة النسخة الاحتياطية...');
    setShowRestoreConfirm(false);

    try {
      await settingsApi.restoreBackup(restoreFile);
      toast.success('تم استعادة النسخة الاحتياطية بنجاح');
      fetchSettings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في استعادة النسخة');
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
    { id: 'company', name: 'الشركة', icon: '🏢' },
    { id: 'legal', name: 'المعلومات القانونية', icon: '📋' },
    { id: 'general', name: 'عام', icon: '⚙️' },
    { id: 'invoice', name: 'الفواتير', icon: '📄' },
    { id: 'appearance', name: 'المظهر', icon: '🎨' },
    { id: 'security', name: 'الأمان', icon: '🔒' },
    { id: 'backup', name: 'النسخ الاحتياطي', icon: '💾' },
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
        <div className="card w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <LockClosedIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold dark:text-white">الإعدادات محمية</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">يرجى إدخال كلمة المرور للوصول إلى الإعدادات</p>
          </div>

          <form onSubmit={handleVerifyPassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="input"
                placeholder="أدخل كلمة المرور..."
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="btn btn-primary w-full"
            >
              {isVerifying ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  جاري التحقق...
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  دخول
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">الإعدادات</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
          title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {darkMode ? (
            <SunIcon className="w-6 h-6 text-yellow-500" />
          ) : (
            <MoonIcon className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
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
          <div className="card">
            {activeTab === 'company' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">معلومات الشركة</h2>

                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعار الشركة</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
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
                        className="btn btn-secondary text-sm"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        رفع شعار
                      </button>
                      {logoPreview && (
                        <button
                          onClick={handleDeleteLogo}
                          className="btn btn-danger text-sm"
                        >
                          <TrashIcon className="w-4 h-4" />
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">الحد الأقصى: 2 ميجابايت. PNG, JPG, GIF</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم الشركة</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الهاتف</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                    <textarea
                      value={settings.company_address}
                      onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder="بسكرة، الجزائر"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">المعلومات القانونية (للفواتير)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">هذه المعلومات ستظهر على جميع الفواتير</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RC (السجل التجاري)
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
                        NIF (الرقم الجبائي)
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
                        AI (رقم المادة)
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
                        NIS (رقم الإحصاء)
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
                      RIB (رقم الحساب البنكي)
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
                <h2 className="text-lg font-semibold mb-4 dark:text-white">الإعدادات العامة</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العملة</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="select"
                    >
                      <option value="DZD">دينار جزائري (DZD)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نسبة الضريبة الافتراضية (%)</label>
                    <input
                      type="number"
                      value={settings.tax_rate}
                      onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تنبيه نقص المخزون (الحد الأدنى)</label>
                    <input
                      type="number"
                      value={settings.low_stock_alert}
                      onChange={(e) => setSettings({ ...settings, low_stock_alert: e.target.value })}
                      className="input"
                    />
                  </div>

                  {/* Auto-validate Orders Setting */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-semibold mb-3 dark:text-white flex items-center gap-2">
                      التصديق التلقائي للطلبات
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full leading-none">جديد</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">هل يتم تأكيد الطلبات تلقائياً عند إنشائها من طرف البائع؟</p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, auto_validate_orders: 'false' })}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${settings.auto_validate_orders === 'false' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.auto_validate_orders === 'false' ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <svg className={`w-5 h-5 ${settings.auto_validate_orders === 'false' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${settings.auto_validate_orders === 'false' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>يدوي - يحتاج موافقة</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">الطلب يبقى معلقاً حتى يوافق عليه المدير</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, auto_validate_orders: 'true' })}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${settings.auto_validate_orders === 'true' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.auto_validate_orders === 'true' ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <svg className={`w-5 h-5 ${settings.auto_validate_orders === 'true' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${settings.auto_validate_orders === 'true' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>تلقائي - مصادقة فورية</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">الطلب يُأكد تلقائياً فور إنشائه</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Seller Client Visibility Setting */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-semibold mb-3 dark:text-white flex items-center gap-2">
                      رؤية العملاء للبائعين
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full leading-none">جديد</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">هل يمكن للبائع رؤية عملاء البائعين الآخرين في التطبيق؟</p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, seller_see_all_clients: 'false' })}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${settings.seller_see_all_clients === 'false' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.seller_see_all_clients === 'false' ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <svg className={`w-5 h-5 ${settings.seller_see_all_clients === 'false' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${settings.seller_see_all_clients === 'false' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>عملاؤه فقط</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">كل بائع يرى فقط العملاء الذين أضافهم</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, seller_see_all_clients: 'true' })}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${settings.seller_see_all_clients === 'true' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.seller_see_all_clients === 'true' ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <svg className={`w-5 h-5 ${settings.seller_see_all_clients === 'true' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${settings.seller_see_all_clients === 'true' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>جميع العملاء</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">البائعون يرون جميع العملاء</p>
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
                <h2 className="text-lg font-semibold mb-4 dark:text-white">إعدادات الفواتير</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بادئة فواتير المبيعات</label>
                      <input
                        type="text"
                        value={settings.invoice_prefix_sale}
                        onChange={(e) => setSettings({ ...settings, invoice_prefix_sale: e.target.value })}
                        className="input"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بادئة فواتير المشتريات</label>
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
                      <span className="text-sm font-medium text-gray-700">طباعة الشعار على الفواتير</span>
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
                      <span className="text-sm font-medium text-gray-700">إظهار معلومات الشركة على الفواتير</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">المظهر</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">اختر المظهر</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setDarkMode(false);
                          document.documentElement.classList.remove('dark');
                          localStorage.setItem('darkMode', 'false');
                          window.dispatchEvent(new StorageEvent('storage', { key: 'darkMode', newValue: 'false' }));
                        }}
                        className={`flex-1 p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          !darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <SunIcon className="w-8 h-8 text-yellow-500" />
                        <span className="font-medium dark:text-white">الوضع الفاتح</span>
                      </button>
                      <button
                        onClick={() => {
                          setDarkMode(true);
                          document.documentElement.classList.add('dark');
                          localStorage.setItem('darkMode', 'true');
                          window.dispatchEvent(new StorageEvent('storage', { key: 'darkMode', newValue: 'true' }));
                        }}
                        className={`flex-1 p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <MoonIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium dark:text-white">الوضع الداكن</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">إعدادات الأمان</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  حماية صفحة الإعدادات بكلمة مرور. عند التفعيل، سيطلب إدخال كلمة المرور للوصول إلى الإعدادات.
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasPassword ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <LockClosedIcon className={`w-5 h-5 ${hasPassword ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">
                        {hasPassword ? 'الحماية مفعلة' : 'الحماية غير مفعلة'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hasPassword ? 'صفحة الإعدادات محمية بكلمة مرور' : 'يمكن لأي مستخدم الوصول إلى الإعدادات'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSetPassword} className="space-y-4">
                    {hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          كلمة المرور الحالية
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input"
                          placeholder="أدخل كلمة المرور الحالية"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {hasPassword ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input"
                        placeholder="أدخل كلمة المرور"
                        minLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        تأكيد كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input"
                        placeholder="أعد إدخال كلمة المرور"
                        minLength={4}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSettingPassword || !newPassword || !confirmPassword}
                        className="btn btn-primary"
                      >
                        {isSettingPassword ? (
                          <>
                            <div className="spinner w-5 h-5"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <LockClosedIcon className="w-5 h-5" />
                            {hasPassword ? 'تحديث كلمة المرور' : 'تفعيل الحماية'}
                          </>
                        )}
                      </button>

                      {hasPassword && (
                        <button
                          type="button"
                          onClick={handleRemovePassword}
                          disabled={isSettingPassword || !currentPassword}
                          className="btn btn-danger"
                        >
                          <TrashIcon className="w-5 h-5" />
                          إزالة الحماية
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">النسخ الاحتياطي والاستعادة</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  إنشاء نسخة احتياطية مشفرة من جميع بيانات النظام أو استعادة نسخة سابقة.
                  النسخة الاحتياطية مشفرة ولا يمكن قراءتها إلا بواسطة هذا النظام فقط.
                </p>

                {/* Create Backup Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">إنشاء نسخة احتياطية</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        تحميل ملف مشفر يحتوي على جميع البيانات
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="btn btn-primary"
                  >
                    {isCreatingBackup ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        جاري إنشاء النسخة...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        إنشاء وتحميل نسخة احتياطية
                      </>
                    )}
                  </button>
                </div>

                {/* Export SQL Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">تصدير SQL</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        تحميل ملف SQL يمكن استيراده في أي قاعدة بيانات MySQL
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportSql}
                    disabled={isExportingSql}
                    className="btn btn-primary"
                  >
                    {isExportingSql ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        تصدير قاعدة البيانات SQL
                      </>
                    )}
                  </button>
                </div>

                {/* Restore Backup Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L16 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">استعادة نسخة احتياطية</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        رفع ملف .rbk لاستعادة البيانات
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      تحذير: استعادة نسخة احتياطية ستحذف جميع البيانات الحالية واستبدالها بالبيانات الموجودة في النسخة.
                      هذا الإجراء لا يمكن التراجع عنه.
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
                    className="btn btn-secondary"
                  >
                    {isRestoringBackup ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        {restoreProgress || 'جاري الاستعادة...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L16 8m4-4v12" />
                        </svg>
                        اختيار ملف النسخة الاحتياطية
                      </>
                    )}
                  </button>

                  {restoreProgress && !isRestoringBackup && (
                    <p className="text-sm text-gray-500 mt-2">{restoreProgress}</p>
                  )}
                </div>

                {/* Restore Confirmation Modal */}
                {showRestoreConfirm && backupInfo && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">تأكيد الاستعادة</h3>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 text-sm space-y-1">
                        <p className="dark:text-gray-300"><strong>تاريخ النسخة:</strong> {new Date(backupInfo.created_at).toLocaleString('ar-DZ')}</p>
                        <p className="dark:text-gray-300"><strong>أنشأها:</strong> {backupInfo.created_by}</p>
                        <p className="dark:text-gray-300"><strong>الإصدار:</strong> {backupInfo.version}</p>
                        {backupInfo.table_counts && (
                          <p className="dark:text-gray-300">
                            <strong>عدد الجداول:</strong> {Object.keys(backupInfo.table_counts).length}
                          </p>
                        )}
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          سيتم حذف جميع البيانات الحالية واستبدالها. هل أنت متأكد؟
                        </p>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button onClick={handleCancelRestore} className="btn btn-secondary">
                          إلغاء
                        </button>
                        <button onClick={handleConfirmRestore} className="btn btn-danger">
                          تأكيد الاستعادة
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'security' && activeTab !== 'backup' && (
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? (
                    <>
                      <div className="spinner w-5 h-5"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      حفظ الإعدادات
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
