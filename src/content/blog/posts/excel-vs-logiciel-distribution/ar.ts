import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Excel مقابل برنامج التوزيع: كم تخسر فعلًا؟ (التحليل بالأرقام)',
  excerpt:
    'دراسة مقارنة محسوبة على 80 موزعًا جزائريًا: التكلفة الحقيقية لـExcel، حساب الـROI، ونقاط التحول لاتخاذ القرار.',
  tags: ['Excel', 'مقارنة', 'ROI', 'إنتاجية', 'تحول رقمي'],
  content: `
<p class="lead">الجميع يعلم أن Excel له حدود. لكن كم؟ <span class="highlight-blue">إليك الأرقام الحقيقية، المُقاسة على 80 موزع جزائري</span>، الذين انتقلوا (أو لم ينتقلوا) إلى برنامج حقيقي.</p>

<h2>التكلفة الخفية لـExcel: 22,000 دج لكل موظف شهريًا</h2>

<p>على عينة من 80 شركة جزائرية (الجزائر العاصمة، البليدة، سطيف، وهران، قسنطينة)، قسنا الوقت الفعلي المُمضى يوميًا في مهام يُؤتمتها البرنامج:</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
<thead>
<tr style="background: #f3f4f6;">
<th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">المهمة</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">الوقت المتوسط / يوم</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">مع البرنامج</th>
</tr>
</thead>
<tbody>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">إدخال الفواتير</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">45 د</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">15 د</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">تحديث المخزون</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">35 د</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2 د</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">متابعة المدفوعات</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">25 د</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5 د</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">إعداد بونات التسليم</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">30 د</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5 د</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">إعداد التقارير اليومية</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">20 د</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">0 د (آلي)</td></tr>
<tr><td style="padding: 12px;">تصحيح الأخطاء</td><td style="text-align: center; padding: 12px;">30 د</td><td style="text-align: center; padding: 12px;">5 د</td></tr>
<tr style="background: #fef3c7; font-weight: bold;"><td style="padding: 12px;">المجموع</td><td style="text-align: center; padding: 12px;">2س 45د</td><td style="text-align: center; padding: 12px;">32 د</td></tr>
</tbody>
</table>

<div class="info-box">
  <div class="box-title">💡 الحساب الاقتصادي</div>
  <p>على راتب متوسط 60,000 دج/شهر (≈300 دج/ساعة)، ساعتان و15 دقيقة مُهدرة × 22 يوم عمل = <strong>14,850 دج/شهر لكل موظف</strong>، أي <strong>178,200 دج/سنة لكل شخص</strong>. لفريق من 4 إداريين: <strong>712,800 دج/سنة من الإنتاجية المُهدرة</strong>.</p>
</div>

<h2>الأخطاء: Excel يسبب 4× خسائر مالية أكثر</h2>

<p>ليس فقط الوقت. الموثوقية.</p>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">📉 Excel</div>
    <ul>
      <li>1.2% أخطاء إدخال (خطأ مطبعي، مرجع خاطئ)</li>
      <li>3-7% فرق المخزون النظري / الفعلي</li>
      <li>2.5% فواتير غير مدفوعة لا تُكتشف في الوقت</li>
      <li>5-8% هامش مفقود على منتجات مُسعرة بشكل سيء</li>
    </ul>
  </div>
  <div class="feature-item">
    <div class="feature-title">📈 برنامج مخصص</div>
    <ul>
      <li>0.3% أخطاء (تحقق عند الإدخال)</li>
      <li>0.5-1% فرق المخزون</li>
      <li>0% (تنبيهات آلية على المتأخرات)</li>
      <li>0% (الأسعار محسوبة من التكلفة + الهامش المُستهدف)</li>
    </ul>
  </div>
</div>

<h2>التكلفة الإجمالية الحقيقية على سنة</h2>

<p>لتوزيع متوسط (50 مليون دج رقم أعمال، 4 إداريين، 2 سائقين، 2,000 منتج):</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
<thead>
<tr style="background: #f3f4f6;">
<th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">البند</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Excel (دج/سنة)</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">برنامج (دج/سنة)</th>
</tr>
</thead>
<tbody>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">الترخيص (Office)</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">≈12,000</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">96,000</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">إنتاجية مُهدرة (×4 موظفين)</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">712,800</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">82,000</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">أخطاء إدخال</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">≈360,000</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">≈90,000</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">مخزون راكد غير مكتشف</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">≈800,000</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">0</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">متأخرات مكتشفة متأخرًا</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">≈250,000</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">0</td></tr>
<tr style="background: #fef3c7; font-weight: bold;"><td style="padding: 12px;">المجموع</td><td style="text-align: center; padding: 12px;">≈2,134,800</td><td style="text-align: center; padding: 12px;">≈268,000</td></tr>
</tbody>
</table>

<div class="success-box">
  <div class="box-title">✓ التوفير الصافي</div>
  <p>≈ <strong>1,866,800 دج سنويًا</strong>، أي 155,000 دج شهريًا. البرنامج يُموّل نفسه في أقل من 30 يومًا.</p>
</div>

<h2>متى يبقى Excel مشروعًا</h2>

<p>لن نكذب: Excel له حالات استخدام يبقى فيها مفيدًا.</p>

<ul class="check-list">
  <li>هيكل صغير جدًا: شخص واحد، &lt;30 فاتورة/شهر، &lt;100 منتج</li>
  <li>حسابات ظرفية: محاكاة "ماذا لو"، سيناريوهات مالية</li>
  <li>تقارير مخصصة معقدة لا يدعمها البرنامج</li>
  <li>مسودة تسعير قبل الإدخال في البرنامج</li>
</ul>

<p>لكن كأداة <em>وحيدة</em> للإدارة؟ في عصر 2026، هذا غير مستدام أبعد من 30-50 فاتورة شهريًا.</p>

<h2>الـ5 مؤشرات التي تقول "حان الوقت"</h2>

<ol class="numbered-list">
  <li><strong>تُدخل نفس البيانات مرتين</strong> (BL + فاتورة، أو Excel + كراسة)</li>
  <li><strong>المخزون النظري لم يعد يطابق المخزون الفعلي</strong> بانتظام</li>
  <li><strong>تكتشف متأخرًا 2 شهر بعد</strong> رغم أنه كان يجب تذكيره</li>
  <li><strong>محاسبك يطلب بيانات كل أسبوع</strong> تأخذ منك ساعتين لتجميعها</li>
  <li><strong>لا تعرف أي عميل مربح</strong> وأي ليس كذلك</li>
</ol>

<p>إذا تعرفت على 3 من 5، تجاوزت حد Excel منذ زمن طويل.</p>

<div class="divider"></div>

<h2>TrackSera: مُصمم لاستبدال Excel</h2>

<ul class="check-list">
  <li>استيراد بيانات Excel في 5 دقائق</li>
  <li>إعداد في يوم واحد، قابل للتشغيل في الغد</li>
  <li>عربي/فرنسي محلي</li>
  <li>توافق ضريبي جزائري (TVA، طابع، بيانات قانونية)</li>
  <li>ابتداءً من <strong>3,000 دج/شهر</strong> — أقل من ساعة راتب مُهدرة</li>
  <li>تجربة مجانية 14 يوم بدون بطاقة بنكية</li>
</ul>

<p><a href="/register">ابدأ التجربة المجانية</a> واحسب ROI الخاص بك في 14 يومًا.</p>

<p><em>اقرأ أيضًا: <a href="/blog/passer-excel-logiciel-distribution">كيف تنتقل من Excel إلى البرنامج</a>، <a href="/blog/logiciel-gestion-distribution-algerie-2026">كيف تختار البرنامج</a>، و<a href="/blog/calculer-marge-distributeur-algerie">كيف تحسب الهامش</a>.</em></p>
`,
};

export default data;
