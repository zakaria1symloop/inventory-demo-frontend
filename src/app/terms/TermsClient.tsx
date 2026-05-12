'use client';

import LegalShell from '@/components/LegalShell';

const EFFECTIVE_DATE = '2026-05-11';

export default function TermsClient() {
  return (
    <LegalShell
      content={{
        badge: { ar: 'الشروط القانونية', fr: 'Conditions légales', en: 'Legal terms' },
        title: {
          ar: 'شروط الاستخدام',
          fr: "Conditions générales d'utilisation",
          en: 'Terms of Service',
        },
        effectiveDate: {
          ar: `سارية المفعول منذ: ${EFFECTIVE_DATE}`,
          fr: `En vigueur depuis le ${EFFECTIVE_DATE}`,
          en: `Effective: ${EFFECTIVE_DATE}`,
        },
        body: { ar: <BodyAr />, fr: <BodyFr />, en: <BodyEn /> },
      }}
    />
  );
}

function BodyEn() {
  return (
    <>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of TrackSera, a
        business management software-as-a-service operated by TrackSera (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;). By creating an account or using the Service, you agree to
        these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        TrackSera provides a cloud-based platform for managing inventory, point-of-sale (POS),
        customer orders, deliveries, mobile sales (CashVan), and invoicing. The Service is offered
        on a subscription basis to businesses (the &quot;Customer&quot; or &quot;you&quot;).
      </p>

      <h2>2. Account Registration</h2>
      <p>
        You must provide accurate information when creating an account and keep it up to date. You
        are responsible for safeguarding your password and for any activity that occurs under your
        account. Notify us immediately of any unauthorized access.
      </p>

      <h2>3. Subscriptions and Billing</h2>
      <ul>
        <li>
          Subscriptions are billed in advance on a monthly or annual cycle as selected at sign-up.
        </li>
        <li>
          Prices are displayed in USD on the pricing page. Local taxes may be added at checkout
          depending on your jurisdiction.
        </li>
        <li>
          Payments are processed by our payment provider, Paddle.com Market Limited (Paddle), acting
          as the Merchant of Record. Paddle&apos;s terms apply to the payment transaction.
        </li>
        <li>
          Subscriptions renew automatically unless cancelled before the end of the current billing
          period.
        </li>
        <li>
          We may change subscription prices with at least 30 days&apos; prior notice. The new price
          applies at your next renewal.
        </li>
      </ul>

      <h2>4. Free Trial and Free Plan</h2>
      <p>
        We may offer a free trial period or a limited free plan. We may modify, restrict, or end
        free access at any time. You will not be charged unless you upgrade to a paid plan.
      </p>

      <h2>5. Cancellation</h2>
      <p>
        You may cancel your subscription at any time from your account dashboard or by contacting
        support. Cancellation takes effect at the end of the current billing period; the Service
        remains available until then.
      </p>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful, fraudulent, or harmful purpose;</li>
        <li>
          Upload content that infringes intellectual property rights or contains malware or illegal
          material;
        </li>
        <li>
          Attempt to gain unauthorized access to, probe, or disrupt the Service or other
          customers&apos; accounts;
        </li>
        <li>
          Resell, sublicense, or expose the Service to third parties outside your organization
          without our written consent;
        </li>
        <li>Use the Service to send unsolicited bulk messages or spam.</li>
      </ul>
      <p>
        We may suspend or terminate accounts that violate these rules, with or without prior notice
        depending on severity.
      </p>

      <h2>7. Your Data</h2>
      <p>
        You retain all rights to the data you input into the Service (&quot;Customer Data&quot;).
        You grant us a limited license to host, process, and display Customer Data solely as needed
        to provide the Service. We will not access Customer Data except as needed for support,
        security, or as required by law. Our handling of personal data is described in our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>8. Availability and Support</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. Scheduled
        maintenance will be communicated in advance when reasonably possible. Customer support is
        available by email, WhatsApp, and phone during business hours.
      </p>

      <h2>9. Intellectual Property</h2>
      <p>
        TrackSera, including its software, design, trademarks, and documentation, is our property
        or that of our licensors. We grant you a non-exclusive, non-transferable right to use the
        Service during your active subscription. You may not copy, modify, reverse-engineer, or
        create derivative works of the Service.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate your access for material breach of these Terms. On termination,
        your right to use the Service ends and we may delete your data after a reasonable retention
        period as described in the Privacy Policy. You may export your data at any time before
        termination.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the maximum
        extent permitted by law, we disclaim all warranties, express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement. We do not warrant
        that the Service will be error-free or meet every requirement.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability arising out of or relating to
        these Terms or the Service shall not exceed the amount you paid us in the 12 months
        preceding the event giving rise to the claim. We are not liable for indirect, incidental,
        special, consequential, or punitive damages, including lost profits or lost data.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to defend and indemnify us against any claim arising from your Customer Data,
        your use of the Service in violation of these Terms, or your violation of applicable law.
      </p>

      <h2>14. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated by email
        or in-product notice at least 30 days in advance. Continued use after the effective date
        constitutes acceptance.
      </p>

      <h2>15. Governing Law</h2>
      <p>
        These Terms are governed by applicable commercial law. Any dispute shall be subject to the
        exclusive jurisdiction of the competent courts, except where mandatory consumer protection
        law provides otherwise.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms can be sent to <strong>contact@tracksera.com</strong> or via
        WhatsApp at +213 549 575 512.
      </p>
    </>
  );
}

function BodyFr() {
  return (
    <>
      <p>
        Les présentes conditions générales (&laquo;&nbsp;Conditions&nbsp;&raquo;) régissent
        l&apos;accès et l&apos;utilisation de TrackSera, un logiciel de gestion d&apos;entreprise
        en mode SaaS (&laquo;&nbsp;Service&nbsp;&raquo;) exploité par TrackSera
        (&laquo;&nbsp;nous&nbsp;&raquo;). En créant un compte ou en utilisant le Service, vous
        acceptez ces Conditions.
      </p>

      <h2>1. Le Service</h2>
      <p>
        TrackSera fournit une plateforme cloud pour la gestion du stock, de la caisse (POS), des
        commandes, des livraisons, de la vente mobile (CashVan) et de la facturation. Le Service
        est fourni par abonnement aux entreprises (&laquo;&nbsp;Client&nbsp;&raquo;).
      </p>

      <h2>2. Inscription</h2>
      <p>
        Vous devez fournir des informations exactes lors de la création de votre compte et les
        maintenir à jour. Vous êtes responsable de la confidentialité de votre mot de passe et de
        toute activité réalisée depuis votre compte. Signalez-nous immédiatement tout accès non
        autorisé.
      </p>

      <h2>3. Abonnement et facturation</h2>
      <ul>
        <li>
          Les abonnements sont facturés d&apos;avance, mensuellement ou annuellement selon
          l&apos;option choisie.
        </li>
        <li>
          Les prix sont affichés en USD sur la page tarifs. Les taxes locales peuvent
          s&apos;ajouter au paiement selon votre juridiction.
        </li>
        <li>
          Les paiements sont traités par notre prestataire Paddle.com Market Limited (Paddle),
          agissant comme Merchant of Record. Les conditions Paddle s&apos;appliquent à la
          transaction.
        </li>
        <li>
          Les abonnements se renouvellent automatiquement sauf annulation avant la fin de la
          période en cours.
        </li>
        <li>
          Nous pouvons modifier les tarifs avec un préavis d&apos;au moins 30 jours. Le nouveau prix
          s&apos;applique au renouvellement suivant.
        </li>
      </ul>

      <h2>4. Essai gratuit</h2>
      <p>
        Nous pouvons proposer une période d&apos;essai gratuit ou un plan gratuit limité. Nous
        pouvons modifier ou supprimer l&apos;accès gratuit à tout moment. Aucun prélèvement ne sera
        effectué sans passage volontaire à un plan payant.
      </p>

      <h2>5. Résiliation</h2>
      <p>
        Vous pouvez résilier votre abonnement à tout moment depuis votre espace ou en contactant le
        support. La résiliation prend effet à la fin de la période en cours&nbsp;; le Service reste
        accessible jusque-là.
      </p>

      <h2>6. Usage acceptable</h2>
      <p>Vous vous engagez à ne pas&nbsp;:</p>
      <ul>
        <li>Utiliser le Service à des fins illicites, frauduleuses ou nuisibles&nbsp;;</li>
        <li>
          Téléverser du contenu illégal, des logiciels malveillants ou du contenu portant atteinte
          aux droits de tiers&nbsp;;
        </li>
        <li>
          Tenter d&apos;accéder sans autorisation au Service ou aux comptes d&apos;autres
          clients&nbsp;;
        </li>
        <li>
          Revendre, sous-licencier ou exposer le Service à des tiers en dehors de votre
          organisation sans notre accord écrit&nbsp;;
        </li>
        <li>Envoyer des messages non sollicités ou du spam via le Service.</li>
      </ul>
      <p>
        Nous pouvons suspendre ou résilier les comptes qui enfreignent ces règles, avec ou sans
        préavis selon la gravité.
      </p>

      <h2>7. Vos données</h2>
      <p>
        Vous conservez tous les droits sur les données que vous saisissez dans le Service
        (&laquo;&nbsp;Données Client&nbsp;&raquo;). Vous nous accordez une licence limitée pour les
        héberger, les traiter et les afficher uniquement aux fins de fourniture du Service. Nos
        pratiques en matière de données personnelles sont décrites dans la{' '}
        <a href="/privacy">politique de confidentialité</a>.
      </p>

      <h2>8. Disponibilité et support</h2>
      <p>
        Nous visons une haute disponibilité mais ne garantissons pas un service ininterrompu. Les
        maintenances planifiées sont annoncées à l&apos;avance lorsque c&apos;est possible. Le
        support est disponible par email, WhatsApp et téléphone aux heures de bureau.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        TrackSera, son logiciel, son design, ses marques et sa documentation nous appartiennent ou
        appartiennent à nos concédants. Nous vous accordons un droit d&apos;usage non exclusif et
        non transférable durant votre abonnement actif. Toute copie, modification ou rétro-ingénierie
        est interdite.
      </p>

      <h2>10. Résiliation par nos soins</h2>
      <p>
        Nous pouvons suspendre ou résilier votre accès en cas de manquement grave à ces Conditions.
        À la résiliation, votre droit d&apos;utiliser le Service prend fin et vos données peuvent
        être supprimées après un délai raisonnable décrit dans la politique de confidentialité.
        Vous pouvez exporter vos données à tout moment avant la résiliation.
      </p>

      <h2>11. Avertissements</h2>
      <p>
        Le Service est fourni &laquo;&nbsp;en l&apos;état&nbsp;&raquo;. Dans la limite autorisée
        par la loi, nous excluons toute garantie expresse ou implicite, notamment de qualité
        marchande, d&apos;adéquation à un usage particulier ou de non-contrefaçon.
      </p>

      <h2>12. Limitation de responsabilité</h2>
      <p>
        Dans la limite autorisée par la loi, notre responsabilité totale ne dépassera pas les
        sommes que vous nous avez versées au cours des 12 mois précédant le fait générateur. Nous
        ne sommes pas responsables des dommages indirects, accessoires ou consécutifs, y compris la
        perte de profits ou de données.
      </p>

      <h2>13. Indemnisation</h2>
      <p>
        Vous acceptez de nous défendre et indemniser contre toute réclamation découlant de vos
        Données Client, de votre utilisation du Service en violation de ces Conditions ou de votre
        violation des lois applicables.
      </p>

      <h2>14. Modifications</h2>
      <p>
        Nous pouvons mettre à jour ces Conditions. Les changements importants seront notifiés par
        email ou dans le produit au moins 30 jours à l&apos;avance. Toute utilisation continue après
        la date d&apos;effet vaut acceptation.
      </p>

      <h2>15. Loi applicable</h2>
      <p>
        Les présentes Conditions sont régies par le droit commercial applicable. Tout litige relève
        de la juridiction exclusive des tribunaux compétents, sauf disposition impérative de
        protection des consommateurs.
      </p>

      <h2>16. Contact</h2>
      <p>
        Pour toute question, écrivez à <strong>contact@tracksera.com</strong> ou WhatsApp au +213
        549 575 512.
      </p>
    </>
  );
}

function BodyAr() {
  return (
    <>
      <p>
        تنظم شروط الاستخدام هذه (&quot;الشروط&quot;) وصولك إلى منصة TrackSera (&quot;الخدمة&quot;)
        واستخدامك لها، وهي برنامج إدارة أعمال يُقدَّم كخدمة سحابية تشغّله شركة TrackSera
        (&quot;نحن&quot;). بإنشاء حساب أو باستخدام الخدمة، فإنك توافق على هذه الشروط.
      </p>

      <h2>1. الخدمة</h2>
      <p>
        تقدّم TrackSera منصة سحابية لإدارة المخزون، الكاشير (POS)، طلبات العملاء، التوصيل، البيع
        المتنقل (CashVan)، والفوترة. تُقدَّم الخدمة عبر اشتراك للشركات (&quot;العميل&quot;).
      </p>

      <h2>2. إنشاء الحساب</h2>
      <p>
        يجب تقديم معلومات صحيحة عند إنشاء الحساب والحفاظ على تحديثها. أنت مسؤول عن سرية كلمة المرور
        وعن أي نشاط يتم من حسابك. أبلغنا فوراً عند أي وصول غير مصرّح به.
      </p>

      <h2>3. الاشتراك والفوترة</h2>
      <ul>
        <li>تُحصَّل الاشتراكات مقدماً شهرياً أو سنوياً حسب الخطة المختارة عند التسجيل.</li>
        <li>
          الأسعار معروضة بالدولار الأمريكي في صفحة التسعير. قد تُضاف الضرائب المحلية عند الدفع حسب
          ولايتك القضائية.
        </li>
        <li>
          تتم معالجة المدفوعات عبر شريكنا Paddle.com Market Limited (Paddle) كـ Merchant of Record.
          تنطبق شروط Paddle على عملية الدفع.
        </li>
        <li>تتجدد الاشتراكات تلقائياً ما لم يتم إلغاؤها قبل انتهاء دورة الفوترة الحالية.</li>
        <li>
          يمكننا تعديل الأسعار بإشعار مسبق لا يقل عن 30 يوماً. يسري السعر الجديد عند التجديد
          التالي.
        </li>
      </ul>

      <h2>4. الفترة التجريبية والخطة المجانية</h2>
      <p>
        قد نقدّم فترة تجريبية مجانية أو خطة مجانية محدودة. يمكننا تعديل أو إنهاء الوصول المجاني في
        أي وقت. لن يتم تحصيل أي مبلغ منك إلا إذا انتقلت طوعاً إلى خطة مدفوعة.
      </p>

      <h2>5. الإلغاء</h2>
      <p>
        يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم أو بالتواصل مع الدعم. يسري الإلغاء في نهاية
        دورة الفوترة الحالية، وتبقى الخدمة متاحة حتى ذلك التاريخ.
      </p>

      <h2>6. الاستخدام المقبول</h2>
      <p>تتعهد بألا تقوم بـ:</p>
      <ul>
        <li>استخدام الخدمة لأي غرض غير قانوني أو احتيالي أو ضار؛</li>
        <li>رفع محتوى يخالف حقوق الملكية الفكرية أو يحتوي على برمجيات خبيثة أو محتوى غير قانوني؛</li>
        <li>محاولة الوصول غير المصرّح به إلى الخدمة أو حسابات عملاء آخرين؛</li>
        <li>إعادة بيع الخدمة أو ترخيصها أو إتاحتها لأطراف خارج مؤسستك دون إذن خطي منا؛</li>
        <li>إرسال رسائل غير مرغوب فيها أو سبام عبر الخدمة.</li>
      </ul>
      <p>يحق لنا تعليق أو إنهاء الحسابات المخالفة، بإشعار مسبق أو بدونه حسب درجة المخالفة.</p>

      <h2>7. بياناتك</h2>
      <p>
        تحتفظ بكامل الحقوق على البيانات التي تدخلها في الخدمة (&quot;بيانات العميل&quot;). تمنحنا
        ترخيصاً محدوداً لاستضافة ومعالجة وعرض هذه البيانات فقط لتقديم الخدمة. تفاصيل التعامل مع
        البيانات الشخصية موضحة في <a href="/privacy">سياسة الخصوصية</a>.
      </p>

      <h2>8. التوافر والدعم</h2>
      <p>
        نسعى لتوافر عالٍ، لكننا لا نضمن خدمة بلا انقطاع. تُعلن الصيانة المجدولة مسبقاً عند الإمكان.
        الدعم متاح عبر البريد الإلكتروني وواتساب والهاتف خلال ساعات العمل.
      </p>

      <h2>9. الملكية الفكرية</h2>
      <p>
        TrackSera بما فيها البرمجيات والتصميم والعلامات التجارية والوثائق ملك لنا أو لمرخّصينا.
        نمنحك حق استخدام غير حصري وغير قابل للتحويل طوال فترة اشتراكك. يُمنع النسخ أو التعديل أو
        الهندسة العكسية.
      </p>

      <h2>10. إنهاء الخدمة من قبلنا</h2>
      <p>
        يمكننا تعليق أو إنهاء وصولك في حال الإخلال الجوهري بهذه الشروط. عند الإنهاء، ينتهي حقك في
        استخدام الخدمة وقد تُحذف بياناتك بعد فترة احتفاظ معقولة موضحة في سياسة الخصوصية. يمكنك
        تصدير بياناتك في أي وقت قبل الإنهاء.
      </p>

      <h2>11. إخلاء المسؤولية</h2>
      <p>
        تُقدَّم الخدمة &quot;كما هي&quot;. في الحدود التي يسمح بها القانون، نخلي مسؤوليتنا من أي
        ضمانات صريحة أو ضمنية، بما فيها صلاحية البضاعة، الملاءمة لغرض معين، وعدم انتهاك حقوق
        الغير.
      </p>

      <h2>12. تحديد المسؤولية</h2>
      <p>
        في الحدود التي يسمح بها القانون، لن تتجاوز مسؤوليتنا الإجمالية المبالغ التي دفعتها لنا
        خلال الـ 12 شهراً السابقة على الحدث المُسبِّب للمطالبة. لا نتحمل مسؤولية الأضرار غير
        المباشرة أو التبعية بما فيها الأرباح أو البيانات المفقودة.
      </p>

      <h2>13. التعويض</h2>
      <p>
        توافق على الدفاع عنّا وتعويضنا ضد أي مطالبة ناتجة عن بيانات العميل الخاصة بك، أو
        استخدامك للخدمة بشكل مخالف لهذه الشروط، أو انتهاكك للقانون المعمول به.
      </p>

      <h2>14. تعديل الشروط</h2>
      <p>
        قد نُحدّث هذه الشروط من وقت لآخر. تُبلَّغ التغييرات الجوهرية بالبريد الإلكتروني أو داخل
        المنتج قبل 30 يوماً على الأقل. الاستمرار في الاستخدام بعد تاريخ السريان يُعتبر قبولاً.
      </p>

      <h2>15. القانون المعمول به</h2>
      <p>
        تخضع هذه الشروط للقانون التجاري المعمول به. تختص المحاكم المختصة بأي نزاع، باستثناء أحكام
        حماية المستهلك الإلزامية.
      </p>

      <h2>16. التواصل</h2>
      <p>
        للأسئلة، راسلنا على <strong>contact@tracksera.com</strong> أو واتساب 549575512 213+.
      </p>
    </>
  );
}
