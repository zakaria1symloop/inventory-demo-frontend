'use client';

import LegalShell from '@/components/LegalShell';

const EFFECTIVE_DATE = '2026-05-11';

export default function RefundClient() {
  return (
    <LegalShell
      content={{
        badge: { ar: 'استرداد المبالغ', fr: 'Remboursements', en: 'Refunds' },
        title: {
          ar: 'سياسة استرداد المبالغ',
          fr: 'Politique de remboursement',
          en: 'Refund Policy',
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
        We want you to be satisfied with TrackSera. This Refund Policy describes when refunds are
        offered, how to request one, and the exclusions that apply.
      </p>

      <h2>1. 14-day money-back guarantee (new subscriptions)</h2>
      <p>
        If you upgrade from the free plan to a paid subscription for the first time and are not
        satisfied, you may request a full refund within <strong>14 days</strong> of the initial
        charge — no questions asked.
      </p>

      <h2>2. Free trial</h2>
      <p>
        Our free trial period and free plan let you evaluate the product without charge. No payment
        is taken during the trial, so no refund is needed.
      </p>

      <h2>3. Monthly subscription renewals</h2>
      <p>
        You can cancel a monthly subscription at any time from your dashboard or by contacting
        support. Cancellation stops future renewals; the current paid month is not refunded as it
        remains usable until the end of the billing period. Exception: if a renewal was charged in
        error (e.g., you cancelled before the renewal date but were still charged), we will refund
        the full renewal.
      </p>

      <h2>4. Annual subscriptions</h2>
      <p>
        Annual plans can be cancelled at any time. If you cancel within 14 days of an annual
        payment, you receive a full refund. After 14 days, we provide a prorated refund for unused
        months of the annual term, on request.
      </p>

      <h2>5. Exclusions</h2>
      <p>Refunds are generally not available for:</p>
      <ul>
        <li>
          Accounts terminated for breach of the <a href="/terms">Terms of Service</a>;
        </li>
        <li>Custom add-ons, professional services, or one-time setup fees, once delivered;</li>
        <li>
          Requests made more than 14 days after a monthly charge, or after the prorated window for
          annual plans, except where local consumer law requires otherwise.
        </li>
      </ul>

      <h2>6. How to request a refund</h2>
      <p>
        Email <strong>contact@tracksera.com</strong> from the address on your account, or message
        us on WhatsApp at +213 549 575 512. Include your account email or phone number and the
        approximate date of the charge. We typically respond within 2 business days.
      </p>

      <h2>7. Processing time</h2>
      <p>
        Approved refunds are issued by our payment processor (Paddle) to the original payment
        method. Paddle typically processes the refund within <strong>5&ndash;10 business days</strong>;
        bank delays may add a few additional days.
      </p>

      <h2>8. Chargebacks</h2>
      <p>
        If you have a billing issue, please contact us first — disputes filed directly with your
        bank without contacting us can delay resolution. We are committed to resolving legitimate
        billing concerns quickly.
      </p>

      <h2>9. Statutory rights</h2>
      <p>
        Nothing in this policy affects any mandatory statutory rights you may have under local
        consumer protection law.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions: <strong>contact@tracksera.com</strong> / WhatsApp +213 549 575 512.
      </p>
    </>
  );
}

function BodyFr() {
  return (
    <>
      <p>
        Nous souhaitons que TrackSera vous satisfasse. Cette politique décrit quand un
        remboursement est possible, comment le demander et les exclusions applicables.
      </p>

      <h2>1. Garantie 14 jours satisfait ou remboursé (nouveaux abonnements)</h2>
      <p>
        Si vous passez pour la première fois du plan gratuit à un abonnement payant et que vous
        n&apos;êtes pas satisfait, vous pouvez demander un remboursement intégral dans les{' '}
        <strong>14 jours</strong> suivant le premier prélèvement — sans justification.
      </p>

      <h2>2. Essai gratuit</h2>
      <p>
        L&apos;essai gratuit et le plan gratuit vous permettent d&apos;évaluer le produit sans
        frais. Aucun paiement n&apos;étant pris durant cette période, aucun remboursement
        n&apos;est nécessaire.
      </p>

      <h2>3. Renouvellements mensuels</h2>
      <p>
        Vous pouvez annuler un abonnement mensuel à tout moment depuis votre espace ou en
        contactant le support. L&apos;annulation arrête les renouvellements futurs&nbsp;; le mois
        en cours n&apos;est pas remboursé car il reste utilisable jusqu&apos;à la fin de la
        période de facturation. Exception&nbsp;: si un renouvellement vous a été prélevé par
        erreur (annulation faite avant la date de renouvellement mais prélèvement effectué),
        nous remboursons l&apos;intégralité.
      </p>

      <h2>4. Abonnements annuels</h2>
      <p>
        Un abonnement annuel peut être annulé à tout moment. Annulation dans les 14 jours suivant
        le paiement annuel&nbsp;: remboursement intégral. Au-delà&nbsp;: remboursement au prorata
        des mois non utilisés, sur demande.
      </p>

      <h2>5. Exclusions</h2>
      <p>Les remboursements ne sont généralement pas accordés pour&nbsp;:</p>
      <ul>
        <li>
          Les comptes résiliés pour manquement aux <a href="/terms">conditions d&apos;utilisation</a>&nbsp;;
        </li>
        <li>Les modules sur mesure, prestations ou frais d&apos;installation, une fois livrés&nbsp;;</li>
        <li>
          Les demandes faites plus de 14 jours après un prélèvement mensuel ou en dehors de la
          fenêtre prorata pour les abonnements annuels, sauf si la loi locale en dispose autrement.
        </li>
      </ul>

      <h2>6. Comment demander un remboursement</h2>
      <p>
        Envoyez un email à <strong>contact@tracksera.com</strong> depuis l&apos;adresse liée à
        votre compte, ou contactez-nous sur WhatsApp au +213 549 575 512. Précisez l&apos;email
        ou le téléphone de votre compte et la date approximative du prélèvement. Nous répondons
        sous 2 jours ouvrés.
      </p>

      <h2>7. Délai de traitement</h2>
      <p>
        Les remboursements approuvés sont émis par notre prestataire (Paddle) vers le moyen de
        paiement initial. Paddle traite généralement le remboursement sous{' '}
        <strong>5 à 10 jours ouvrés</strong>&nbsp;; des délais bancaires peuvent ajouter quelques
        jours.
      </p>

      <h2>8. Litiges bancaires</h2>
      <p>
        Si vous avez un souci de facturation, contactez-nous d&apos;abord — un litige bancaire
        déposé sans nous prévenir peut ralentir la résolution. Nous nous engageons à résoudre
        rapidement toute préoccupation légitime.
      </p>

      <h2>9. Droits légaux</h2>
      <p>
        Cette politique ne porte pas atteinte aux droits impératifs que vous pourriez avoir au
        titre de la législation locale de protection des consommateurs.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions&nbsp;: <strong>contact@tracksera.com</strong> / WhatsApp +213 549 575 512.
      </p>
    </>
  );
}

function BodyAr() {
  return (
    <>
      <p>
        نريد لك تجربة مُرضية مع TrackSera. توضح هذه السياسة متى يكون استرداد المبالغ متاحاً، وكيف
        تطلبه، والاستثناءات المطبّقة.
      </p>

      <h2>1. ضمان 14 يوماً (الاشتراكات الجديدة)</h2>
      <p>
        إذا انتقلت لأول مرة من الخطة المجانية إلى اشتراك مدفوع ولم تكن راضياً، يمكنك طلب استرداد
        كامل خلال <strong>14 يوماً</strong> من أول عملية دفع — دون الحاجة لتبرير.
      </p>

      <h2>2. الفترة التجريبية</h2>
      <p>
        تتيح لك الفترة التجريبية والخطة المجانية تقييم المنتج بدون أي رسوم. لا يتم تحصيل أي مبلغ
        خلال هذه الفترة، فلا حاجة لاسترداد.
      </p>

      <h2>3. التجديدات الشهرية</h2>
      <p>
        يمكنك إلغاء الاشتراك الشهري في أي وقت من لوحة التحكم أو بالتواصل مع الدعم. الإلغاء يوقف
        التجديدات المستقبلية، ولا يُرد المبلغ الشهري الحالي لأنه يبقى قابلاً للاستخدام حتى نهاية
        فترة الفوترة. الاستثناء&nbsp;: إذا تم تحصيل تجديد بالخطأ (ألغيت قبل تاريخ التجديد ومع ذلك
        تم خصمك)، نسترد كامل التجديد.
      </p>

      <h2>4. الاشتراكات السنوية</h2>
      <p>
        يمكن إلغاء الاشتراك السنوي في أي وقت. الإلغاء خلال 14 يوماً من الدفع السنوي&nbsp;:
        استرداد كامل. بعد ذلك&nbsp;: استرداد تناسبي عن الأشهر غير المُستخدمة، بناءً على طلبك.
      </p>

      <h2>5. الاستثناءات</h2>
      <p>لا يُمنح الاسترداد عادةً في الحالات التالية&nbsp;:</p>
      <ul>
        <li>الحسابات المُنهاة بسبب مخالفة <a href="/terms">شروط الاستخدام</a>؛</li>
        <li>الإضافات المخصّصة أو الخدمات الاحترافية أو رسوم التهيئة بعد تسليمها؛</li>
        <li>
          الطلبات المُقدّمة بعد مرور أكثر من 14 يوماً على دفع شهري، أو خارج نافذة الاسترداد
          التناسبي للسنوي، ما لم يستوجب قانون حماية المستهلك المحلي خلاف ذلك.
        </li>
      </ul>

      <h2>6. كيفية طلب الاسترداد</h2>
      <p>
        راسلنا على <strong>contact@tracksera.com</strong> من البريد المرتبط بحسابك، أو عبر واتساب
        549575512 213+. اذكر بريد أو هاتف حسابك والتاريخ التقريبي للدفع. نرد عادةً خلال يومَي
        عمل.
      </p>

      <h2>7. مدة المعالجة</h2>
      <p>
        تُصدر عمليات الاسترداد المُعتمَدة عبر مزوّد الدفع (Paddle) إلى وسيلة الدفع الأصلية. تستغرق
        المعالجة لدى Paddle عادةً <strong>5 إلى 10 أيام عمل</strong>؛ قد تُضيف البنوك بضعة أيام
        إضافية.
      </p>

      <h2>8. النزاعات البنكية (Chargebacks)</h2>
      <p>
        إذا واجهت مشكلة في الفوترة، تواصل معنا أولاً — فتح نزاع بنكي دون إخطارنا قد يُؤخّر الحل.
        نحن ملتزمون بحل أي مشكلة فوترة مشروعة سريعاً.
      </p>

      <h2>9. الحقوق القانونية</h2>
      <p>
        لا تمسّ هذه السياسة بأي حقوق إلزامية قد تكون لك بموجب قانون حماية المستهلك المحلي.
      </p>

      <h2>10. التواصل</h2>
      <p>
        للأسئلة&nbsp;: <strong>contact@tracksera.com</strong> / واتساب 549575512 213+.
      </p>
    </>
  );
}
