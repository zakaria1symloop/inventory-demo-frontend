import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'كيف تحسب هامش الموزع في الجزائر: الصيغ والأخطاء الشائعة',
  excerpt:
    'الفرق بين المردود والربح والهامش يربك معظم الموزعين. إليك الصيغ الصحيحة والمقاييس المعيارية للقطاع في الجزائر.',
  tags: ['هامش', 'حساب الربحية', 'مالية', 'موزع', 'دليل'],
  content: `
<p class="lead">"بعت بـ50 مليون هذا الشهر، لكن أين المال؟" <span class="highlight-blue">هذا السؤال الذي ينتهي كل موزع جزائري بطرحه على نفسه.</span> الإجابة في رقم واحد قليلون يتقنونه فعلًا: الهامش. إليك كيف تحسبه بشكل صحيح.</p>

<h2>الهامش الإجمالي، المردود، الربح: لا تخلط</h2>

<p>ثلاث كلمات، ثلاث حسابات مختلفة:</p>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">📊 الهامش الإجمالي</div>
    <p>الربح ÷ <strong>سعر البيع</strong>. مُعبر عنه بـ% من رقم الأعمال. هو <em>المقياس</em> المرجعي.</p>
    <p><em>مثلاً تكلفة 100، بيع 150 → هامش = 50÷150 = 33%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">📈 المردود (markup)</div>
    <p>الربح ÷ <strong>سعر الشراء</strong>. أعلى من الهامش. كثيرًا ما يُخلط معه.</p>
    <p><em>مثلاً تكلفة 100، بيع 150 → مردود = 50÷100 = 50%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">💵 الربح (النتيجة)</div>
    <p>الهامش الإجمالي × الحجم - المصاريف الثابتة. هو ما يبقى فعلًا في الصندوق في النهاية.</p>
  </div>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ فخ الـ50% التي ليست كذلك</div>
  <p>"مُوردي يبيعني بـ100، أبيع بـ150، أحقق 50% هامش!" خطأ. تحقق 50% <em>مردود</em>، لكن فقط 33% <em>هامش</em>. هذا الخطأ هو السبب رقم 1 لأخطاء التسعير في الجزائر.</p>
</div>

<h2>الصيغة الكاملة للتكلفة</h2>

<p>تكلفة المنتج ليست سعر شرائه. إنها كل ما يجعله متاحًا للعميل النهائي:</p>

<ol class="numbered-list">
  <li><strong>سعر شراء المورد</strong> (HT)</li>
  <li><strong>رسوم جمركية</strong> (إذا استيراد)</li>
  <li><strong>النقل من المصدر</strong> (الميناء → المستودع)</li>
  <li><strong>المصاريف البنكية</strong> (الاعتماد المستندي، الصرف)</li>
  <li><strong>التخزين</strong> (إيجار المستودع ÷ معدل الدوران)</li>
  <li><strong>المناولة</strong> (رواتب أمناء المخزن ÷ الوحدات)</li>
  <li><strong>الكسر، السرقة، انتهاء الصلاحية</strong> (≈ 1-3% حسب القطاع)</li>
  <li><strong>التوزيع</strong> (الوقود، راتب السائق، استهلاك المركبة ÷ الجولات)</li>
  <li><strong>التكاليف الإدارية</strong> (الفواتير، المحاسبة، الدعم ÷ الوحدات)</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 قاعدة الـ1.4×</div>
  <p>لمعظم الموزعين الجزائريين، <strong>التكلفة الكاملة</strong> هي حوالي <strong>1.4 ضعف</strong> سعر شراء المورد. إذا اشتريت بـ100، تكلفة <em>التسليم</em> للعميل تدور حول 140 دج. أي حساب هامش مبني على سعر الشراء فقط هو وهم.</p>
</div>

<h2>المعايير حسب القطاع في الجزائر</h2>

<p>إليك الهوامش النموذجية الملاحظة في السوق الجزائرية (مصادر: استطلاعات ميدانية، ملاحظات مستخدمي TrackSera):</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
<thead>
<tr style="background: #f3f4f6;">
<th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">القطاع</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">الهامش الإجمالي النموذجي</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">الهامش الصافي*</th>
</tr>
</thead>
<tbody>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">الغذاء العام</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-5%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">المشروبات (مياه، غازية)</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">12-22%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">4-8%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">الحليب ومشتقاته</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">النظافة والتجميل</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">18-30%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">الإلكترونيات الاستهلاكية</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">1-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">الصيدلية وشبه الصيدلية</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">15-25%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-9%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">قطع غيار السيارات</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">20-40%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td></tr>
<tr><td style="padding: 12px;">مواد البناء</td><td style="text-align: center; padding: 12px;">10-18%</td><td style="text-align: center; padding: 12px;">3-7%</td></tr>
</tbody>
</table>

<p><em>* الهامش الصافي = بعد خصم كل المصاريف (الإيجار، الرواتب، الضرائب، إلخ)</em></p>

<h2>الـ5 رافعات لزيادة هامشك</h2>

<ol class="numbered-list">
  <li>
    <strong>إعادة التفاوض على أسعار الشراء</strong><br/>
    تخفيض 2% عند المورد = 2 نقطة هامش مكتسبة مباشرة. على مليون رقم أعمال، هذا 20,000 دج/شهر.
  </li>
  <li>
    <strong>تحسين جولات التسليم</strong><br/>
    الوقود هو ثاني أكبر مصروف متغير بعد الشراء. انظر <a href="/blog/optimiser-tournee-livraison-6-regles">6 قواعد لتحسين الجولة</a>.
  </li>
  <li>
    <strong>إقصاء العملاء غير المربحين</strong><br/>
    20% من العملاء يولدون 80% من الربح. الباقون يكلفون أكثر مما يجلبون. حددهم وأوقف التسليمات بخسارة.
  </li>
  <li>
    <strong>قتل المنتجات الميتة</strong><br/>
    منتج يُباع مرة في الشهر يحجز المخزون، يأخذ المساحة، وله خطر انتهاء صلاحية مرتفع. أخرجه من الكتالوج.
  </li>
  <li>
    <strong>حساب الهامش لكل عميل / لكل منتج</strong><br/>
    ليس فقط الهامش الإجمالي. بدون هذا التفصيل، تقود بعمى.
  </li>
</ol>

<div class="success-box">
  <div class="box-title">✓ النتيجة الممكنة</div>
  <p>أحد عملائنا موزع مشروبات في سطيف انتقل من 11% إلى 16% هامش إجمالي في 6 أشهر — فقط بـ: (1) إعادة التفاوض مع موردين اثنين، (2) إقصاء 18 عميل غير مربح، (3) حذف 47 منتج لم يدور. بدون انخفاض في رقم الأعمال. فقط أكثر مال يبقى.</p>
</div>

<div class="divider"></div>

<h2>كيف يعطيك TrackSera الهامش في الوقت الفعلي</h2>

<p>TrackSera يحسب آليًا:</p>

<ul class="check-list">
  <li>الهامش الإجمالي لكل منتج (بالتكلفة المتوسطة المُرجحة)</li>
  <li>الهامش الإجمالي لكل عميل (على 30، 90، 365 يومًا)</li>
  <li>الهامش الإجمالي لكل سائق، لكل مركبة، لكل جولة</li>
  <li>الهامش الإجمالي لكل ولاية / لكل قطاع نشاط</li>
  <li>الكشف الآلي عن المبيعات بخسارة (تنبيه)</li>
  <li>أعلى/أسوأ المنتجات بالهامش بالقيمة المطلقة</li>
  <li>المقارنة بين الفترات (هذا الشهر مقابل الماضي)</li>
</ul>

<p><a href="/register">ابدأ تجربة مجانية 14 يومًا</a> واكتشف هوامشك الحقيقية.</p>

<p><em>اقرأ أيضًا: <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 أرقام للمراقبة كل صباح</a>، <a href="/blog/tva-9-19-algerie-distribution">TVA 9% أو 19% في الجزائر</a>، و<a href="/blog/excel-vs-logiciel-distribution">Excel مقابل البرنامج: كم تخسر</a>.</em></p>
`,
};

export default data;
