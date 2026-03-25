'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsApi, productsApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import StepWelcome from './onboarding/StepWelcome';
import StepProducts from './onboarding/StepProducts';
import StepClients from './onboarding/StepClients';
import StepWorkflow from './onboarding/StepWorkflow';
import StepDone from './onboarding/StepDone';

type Lang = 'ar' | 'fr';

interface OnboardingWizardProps {
  settings: Record<string, string>;
  onComplete: () => void;
}

const stepLabels = {
  ar: {
    welcome: 'الشركة',
    products: 'المنتجات',
    clients: 'العملاء',
    workflow: 'سير العمل',
    done: 'انتهى',
    next: 'التالي',
    back: 'السابق',
    skip: 'تخطي الإعداد',
    skipStep: 'تخطي',
    finish: 'ابدأ الاستخدام',
    saving: 'جاري الحفظ...',
  },
  fr: {
    welcome: 'Entreprise',
    products: 'Produits',
    clients: 'Clients',
    workflow: 'Processus',
    done: 'Terminé',
    next: 'Suivant',
    back: 'Retour',
    skip: 'Passer la configuration',
    skipStep: 'Passer',
    finish: 'Commencer',
    saving: 'Enregistrement...',
  },
};

type StepId = 'welcome' | 'products' | 'clients' | 'workflow' | 'done';

export default function OnboardingWizard({ settings, onComplete }: OnboardingWizardProps) {
  const [lang, setLang] = useState<Lang>('ar');
  const [currentStep, setCurrentStep] = useState(0);
  const [hasProducts, setHasProducts] = useState<boolean | null>(null);
  const [hasClients, setHasClients] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: settings.company_name || '',
    company_phone: settings.company_phone || '',
    company_address: settings.company_address || '',
  });

  const labels = stepLabels[lang];
  const isRtl = lang === 'ar';

  // Check existing data on mount
  useEffect(() => {
    const checkData = async () => {
      try {
        const [productsRes, clientsRes] = await Promise.all([
          productsApi.getAll({ per_page: 1 }),
          clientsApi.getAll({ per_page: 1 }),
        ]);
        setHasProducts((productsRes.data?.total ?? productsRes.data?.data?.length ?? 0) > 0);
        setHasClients((clientsRes.data?.total ?? clientsRes.data?.data?.length ?? 0) > 0);
      } catch {
        // If API fails, show all steps
        setHasProducts(false);
        setHasClients(false);
      }
    };
    checkData();
  }, []);

  // Restore step from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_step');
    if (saved) {
      const step = parseInt(saved, 10);
      if (!isNaN(step) && step >= 0) setCurrentStep(step);
    }
  }, []);

  // Save step to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_step', String(currentStep));
  }, [currentStep]);

  // Build dynamic steps
  const steps: StepId[] = ['welcome'];
  if (hasProducts === false) steps.push('products');
  if (hasClients === false) steps.push('clients');
  steps.push('workflow', 'done');

  const totalSteps = steps.length;
  const activeStepId = steps[Math.min(currentStep, totalSteps - 1)];
  const isLastStep = currentStep >= totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Wait until data checks complete
  if (hasProducts === null || hasClients === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {lang === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    // On welcome step, save company data
    if (activeStepId === 'welcome') {
      if (!companyData.company_name.trim()) {
        toast.error(lang === 'ar' ? 'اسم الشركة مطلوب' : "Le nom de l'entreprise est requis");
        return;
      }
      setIsSaving(true);
      try {
        await settingsApi.update({
          company_name: companyData.company_name,
          company_phone: companyData.company_phone,
          company_address: companyData.company_address,
        });
      } catch {
        // Continue even if save fails — can be done later in settings
      }
      setIsSaving(false);
    }

    if (isLastStep) {
      await completeOnboarding();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const completeOnboarding = async () => {
    setIsSaving(true);
    try {
      await settingsApi.update({ onboarding_completed: 'true' });
    } catch {
      // Don't block user
    }
    localStorage.removeItem('onboarding_step');
    setIsSaving(false);
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            {lang === 'ar' ? 'Français' : 'العربية'}
          </button>

          {/* Logo */}
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Track<span className="text-blue-600">Sera</span>
          </span>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {labels.skip}
          </button>
        </div>

        {/* Progress stepper */}
        <div className="px-4 sm:px-6 pt-6 pb-2">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-1">
              {steps.map((stepId, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <div key={stepId} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap hidden sm:block ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {stepLabels[lang][stepId]}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-[-0.25rem] rounded-full transition-colors ${
                        idx < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 pb-28">
          <div className="w-full max-w-lg">
            {activeStepId === 'welcome' && (
              <StepWelcome lang={lang} companyData={companyData} onUpdate={setCompanyData} />
            )}
            {activeStepId === 'products' && (
              <StepProducts
                lang={lang}
                hasProducts={hasProducts}
                onRefresh={() => setHasProducts(true)}
              />
            )}
            {activeStepId === 'clients' && (
              <StepClients
                lang={lang}
                hasClients={hasClients}
                onRefresh={() => setHasClients(true)}
              />
            )}
            {activeStepId === 'workflow' && <StepWorkflow lang={lang} />}
            {activeStepId === 'done' && <StepDone lang={lang} />}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            {!isFirstStep ? (
              <button
                onClick={handleBack}
                className="btn border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5"
              >
                <svg className={`w-4 h-4 ${isRtl ? 'ms-1.5 rotate-180' : 'me-1.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {labels.back}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {/* Skip step button (for products/clients steps) */}
              {(activeStepId === 'products' || activeStepId === 'clients') && (
                <button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="btn border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 text-sm"
                >
                  {labels.skipStep}
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={isSaving}
                className="btn btn-primary px-6"
              >
                {isSaving ? (
                  <>
                    <div className="spinner w-4 h-4 me-2"></div>
                    {labels.saving}
                  </>
                ) : isLastStep ? (
                  <>
                    {labels.finish}
                    <svg className={`w-4 h-4 ${isRtl ? 'me-1.5 rotate-180' : 'ms-1.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  </>
                ) : (
                  <>
                    {labels.next}
                    <svg className={`w-4 h-4 ${isRtl ? 'me-1.5 rotate-180' : 'ms-1.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
