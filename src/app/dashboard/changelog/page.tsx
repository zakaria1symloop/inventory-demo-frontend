'use client';

const changelog = [
  {
    version: 'v1.0.6',
    date: '2026-03-06',
    changes: [
      { type: 'feature', text: 'إضافة طباعة الفواتير في تطبيق السائق (طلبات مسلّمة/جزئية) بنفس تنسيق تطبيق البائع' },
      { type: 'feature', text: 'عرض معلومات العميل (الاسم، الهاتف، الفئة، الدين) أثناء اختيار المنتجات في تطبيق البائع' },
      { type: 'improvement', text: 'توحيد فاتورة الطباعة PDF في جميع التطبيقات: 7 أعمدة + ملخص (فرعي، خصم، ضريبة، إجمالي، مدفوع، متبقي)' },
      { type: 'improvement', text: 'تحديث صلاحية تحصيل الديون تلقائياً بدون إعادة تسجيل الدخول' },
      { type: 'improvement', text: 'تحديث بيانات المستخدم تلقائياً عند العودة للشاشة الرئيسية في تطبيق البيع المتنقل' },
      { type: 'improvement', text: 'توزيع الدفعات تلقائياً على الفواتير غير المدفوعة (الأقدم أولاً) عند تحصيل الديون' },
      { type: 'fix', text: 'إزالة خصم قيمة البضاعة من الصندوق عند تحويل المخزون (التحويل حركة مخزون وليس حركة مالية)' },
      { type: 'fix', text: 'إضافة التحقق من صلاحية تحصيل الديون في الخادم (403 إذا غير مفعّلة)' },
      { type: 'fix', text: 'إصلاح عدم تحديث قائمة العملاء بعد تحصيل الديون (مشكلة سياق الحوار)' },
      { type: 'fix', text: 'إصلاح عرض مبلغ الدين: استخدام الرصيد الصحيح بدلاً من القيمة القديمة' },
    ],
  },
  {
    version: 'v1.0.5',
    date: '2026-03-04',
    changes: [
      { type: 'feature', text: 'عرض الكميات بالكراتين والقطع في صفحة المخزون مع تفصيل واضح (كرتون + قطعة)' },
      { type: 'feature', text: 'إمكانية إدخال الجرد الفعلي بالكراتين والقطع مع حساب تلقائي للإجمالي' },
      { type: 'feature', text: 'إضافة أعمدة الكراتين في تصدير Excel للمخزون (رصيد افتتاحي، وارد، صادر، رصيد ختامي)' },
      { type: 'feature', text: 'عرض تفصيل الكراتين والقطع في تقرير المخزون (فتح، وارد، صادر، إغلاق)' },
      { type: 'improvement', text: 'تحديث فواتير الطباعة في 3 تطبيقات (بائع، سائق، بيع متنقل) بأعمدة: ق/ك، كراتين، قطع، إجمالي، السعر، المجموع' },
      { type: 'improvement', text: 'تحديث شاشات تفاصيل الطلبات في جميع التطبيقات بعرض واضح للكراتين والقطع' },
      { type: 'improvement', text: 'تحسين فاتورة طباعة المبيعات والمشتريات في لوحة التحكم بأعمدة الكراتين' },
    ],
  },
  {
    version: 'v1.0.4',
    date: '2026-03-04',
    changes: [
      { type: 'feature', text: 'إضافة مكون منتقي التاريخ المخصص (DateInput) بتنسيق يوم-شهر-سنة مع تقويم عربي وأسماء أشهر جزائرية' },
      { type: 'feature', text: 'إضافة فلاتر متقدمة لصفحة الصناديق: بحث، تاريخ من/إلى، حالة الصندوق، المستخدم' },
      { type: 'feature', text: 'إضافة تصدير Excel لقائمة الصناديق مع جميع البيانات والأرصدة' },
      { type: 'feature', text: 'إضافة عمليات إدارية للصندوق: تحصيل، إضافة مبلغ، تحويل بين الصناديق، مصروف' },
      { type: 'feature', text: 'إضافة نظام تسجيل الخسائر (Losses) في صفحة المصروفات مع حركات المخزون' },
      { type: 'feature', text: 'إعادة هيكلة صفحة تفاصيل الصندوق مع فلاتر وإجماليات وعرض محسّن للعمليات' },
      { type: 'improvement', text: 'استبدال جميع حقول التاريخ الأصلية للمتصفح (43 حقل في 27 صفحة) بمنتقي التاريخ المخصص' },
      { type: 'improvement', text: 'منتقي التاريخ يدعم: الوضع الداكن، الكتابة اليدوية، زر اليوم، التنقل بالأشهر والسنوات' },
      { type: 'improvement', text: 'جعل مرجع الدفع قابل للنقر للانتقال مباشرة لفاتورة البيع أو الشراء المرتبطة' },
      { type: 'fix', text: 'إصلاح نقطة API إضافة مبلغ للصندوق (إنشاء endpoint جديد adjust)' },
      { type: 'fix', text: 'إزالة تبويب المصروفات من صفحة الصناديق (نُقل لصفحة مستقلة)' },
    ],
  },
  {
    version: 'v1.0.3',
    date: '2026-03-01',
    changes: [
      { type: 'feature', text: 'إضافة تاريخ ووقت البيع الصحيح في قائمة المبيعات وتفاصيل البيع (تطبيق البيع المتنقل)' },
      { type: 'improvement', text: 'تحديث بيانات العملاء تلقائياً عند فتح شاشة البيع (بدون إعادة تشغيل التطبيق)' },
      { type: 'improvement', text: 'تحسين التحقق من المخزون: المنع من تجاوز الكمية المتوفرة بالقطع وليس بالكراتين' },
      { type: 'improvement', text: 'عند إضافة منتج للسلة والمخزون أقل من كرتون، يبدأ بقطعة واحدة بدلاً من كرتون' },
      { type: 'improvement', text: 'القطع تتحول تلقائياً إلى كراتين عند تجاوز عدد القطع في الكرتون' },
      { type: 'improvement', text: 'توحيد حجم صناديق الكراتين والقطع في شاشة اختيار المنتجات' },
      { type: 'improvement', text: 'عرض رسالة تنبيه عند محاولة إضافة أكثر من المخزون المتوفر' },
      { type: 'fix', text: 'إصلاح خطأ "quantity must be integer" عند طلب منتجات من تطبيق البيع المتنقل' },
      { type: 'fix', text: 'إصلاح خطأ "quantity_approved must be integer" عند الموافقة على طلبات المنتجات' },
      { type: 'fix', text: 'إصلاح خطأ 500 عند البيع بسبب حقل movable_type غير قابل للقيمة الفارغة' },
    ],
  },
  {
    version: 'v1.0.2',
    date: '2026-02-28',
    changes: [
      { type: 'feature', text: 'إنشاء سجل بيع تلقائي عند توصيل الطلبات من تطبيق السائق (يظهر في صفحة المبيعات بمصدر "توصيل")' },
      { type: 'feature', text: 'نقل المخزون تلقائياً من المستودع الرئيسي إلى مستودع السائق عند بدء التوصيل' },
      { type: 'feature', text: 'إمكانية إنشاء مستودع خاص بالسائق أو البائع المتنقل عند إنشاء المستخدم' },
      { type: 'feature', text: 'عرض معلومات مستودع السائق (الاسم وعدد المنتجات) عند اختياره في إنشاء التوصيل' },
      { type: 'feature', text: 'إضافة فلتر "من التوصيل" في صفحة المبيعات مع شارة خاصة بلون برتقالي' },
      { type: 'feature', text: 'عرض إجمالي القطع في نموذج الطلبات الجديدة (كراتين + قطع = المجموع)' },
      { type: 'improvement', text: 'تحسين عرض الكميات في تفاصيل التوصيل: عرض القطع الإجمالية وسعر الكرتون بجانب القطعة' },
      { type: 'improvement', text: 'تحسين حساب المبلغ الإجمالي للتوصيل (الكمية بالقطع وليس بالكراتين)' },
      { type: 'improvement', text: 'المرتجعات تبقى في مستودع السائق حتى معالجتها من المسؤول' },
      { type: 'improvement', text: 'البيع من مستودع السائق بدلاً من المستودع الرئيسي عند التوصيل' },
      { type: 'fix', text: 'إصلاح خطأ حساب إجمالي التوصيل (كان يضرب بعدد القطع في الكرتون مرتين)' },
      { type: 'fix', text: 'إصلاح التوصيل الجزئي: إرسال الكميات كقطع صحيحة بدلاً من أرقام عشرية' },
      { type: 'fix', text: 'إصلاح التوافق بين المخزون القديم (كراتين) والجديد (قطع) مع تحويل تلقائي' },
      { type: 'fix', text: 'إصلاح عرض أسعار فئات العملاء في نموذج البيع السريع' },
    ],
  },
  {
    version: 'v1.0.1',
    date: '2026-02-21',
    changes: [
      { type: 'feature', text: 'إضافة فئات العملاء مع أسعار التجزئة المخصصة لكل فئة' },
      { type: 'feature', text: 'إضافة ربط العملاء بالمستودعات مع إمكانية النقل والنسخ بين المستودعات' },
      { type: 'feature', text: 'إضافة نظام نسخ العملاء مع شارة "نسخة" وإمكانية الإلغاء' },
      { type: 'feature', text: 'إضافة أسعار فئات العملاء في نموذج البيع السريع' },
      { type: 'feature', text: 'إضافة صناديق متعددة للمسؤول مع إعادة تسمية الصناديق' },
      { type: 'feature', text: 'إضافة فلترة العملاء حسب المنشئ وإظهار الرصيد' },
      { type: 'feature', text: 'إضافة خريطة السائقين لتتبع المواقع المباشر' },
      { type: 'feature', text: 'إضافة بونات الطلب (Purchase Orders)' },
      { type: 'feature', text: 'إضافة نظام المصروفات (Dispenses)' },
      { type: 'feature', text: 'إضافة نظام الموظفين' },
      { type: 'feature', text: 'إضافة تحويلات المخزون بين المستودعات' },
      { type: 'improvement', text: 'تحسين تنقل مفتاح Enter في نماذج الشراء والبيع (الكمية ← السعر ← تأكيد)' },
      { type: 'improvement', text: 'إضافة تحذير عند الخروج من شاشة البيع/الطلب مع وجود منتجات في السلة (جميع التطبيقات)' },
      { type: 'improvement', text: 'إضافة معلومات الإصدار والعلامة التجارية في شاشات تسجيل الدخول' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-01-15',
    changes: [
      { type: 'feature', text: 'الإصدار الأول - نظام إدارة المخزون الكامل' },
      { type: 'feature', text: 'إدارة المنتجات والأصناف والعلامات التجارية والوحدات' },
      { type: 'feature', text: 'نظام المشتريات والمبيعات مع الفواتير' },
      { type: 'feature', text: 'إدارة العملاء والموردين' },
      { type: 'feature', text: 'نظام الطلبات والتوصيل والجولات' },
      { type: 'feature', text: 'إدارة المستودعات وحركات المخزون' },
      { type: 'feature', text: 'نظام المدفوعات والتقارير' },
      { type: 'feature', text: 'تطبيق البائع - إنشاء الطلبات وإدارة الجولات' },
      { type: 'feature', text: 'تطبيق السائق - توصيل الطلبات وتتبع الموقع' },
      { type: 'feature', text: 'تطبيق البيع المتنقل - المبيعات المباشرة من المستودع المتنقل' },
    ],
  },
];

const typeBadge = {
  feature: { label: 'جديد', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  improvement: { label: 'تحسين', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  fix: { label: 'إصلاح', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل التحديثات</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">آخر التحديثات والتحسينات على النظام</p>
      </div>

      <div className="space-y-8">
        {changelog.map((release) => (
          <div key={release.version} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{release.version}</span>
                {release.version === 'v1.0.6' && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white">الأحدث</span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{release.date}</span>
            </div>
            <div className="px-6 py-4">
              <ul className="space-y-3">
                {release.changes.map((change, idx) => {
                  const badge = typeBadge[change.type as keyof typeof typeBadge];
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full mt-0.5 flex-shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
        <a href="https://www.symloop.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
          Built by Symloop
        </a>
      </div>
    </div>
  );
}
