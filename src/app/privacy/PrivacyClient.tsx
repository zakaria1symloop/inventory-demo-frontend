'use client';

import LegalShell from '@/components/LegalShell';

const EFFECTIVE_DATE = '2026-05-11';

export default function PrivacyClient() {
  return (
    <LegalShell
      content={{
        badge: { ar: 'الخصوصية', fr: 'Confidentialité', en: 'Privacy' },
        title: {
          ar: 'سياسة الخصوصية',
          fr: 'Politique de confidentialité',
          en: 'Privacy Policy',
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
        This Privacy Policy explains how TrackSera (&quot;we&quot;, &quot;us&quot;) collects, uses,
        and protects personal data when you use our website, sign up for an account, or use our
        software-as-a-service (the &quot;Service&quot;).
      </p>

      <h2>1. Who we are</h2>
      <p>
        TrackSera is a business management software provider. For privacy questions, contact{' '}
        <strong>contact@tracksera.com</strong>.
      </p>

      <h2>2. Data we collect</h2>
      <h3>Account data</h3>
      <p>
        When you create an account, we collect your name, company name, email address, and/or
        phone number, and a hashed password.
      </p>
      <h3>Customer Data</h3>
      <p>
        You may input business data into the Service — products, clients, suppliers, sales,
        invoices, etc. This data belongs to you. We process it solely to provide the Service.
      </p>
      <h3>Payment data</h3>
      <p>
        Payments are processed by <strong>Paddle.com Market Limited</strong> as Merchant of Record.
        Card details are entered on Paddle&apos;s pages and never reach our servers. We receive
        only a transaction reference and billing metadata.
      </p>
      <h3>Usage data</h3>
      <p>
        We log technical information such as IP address, browser, device type, pages visited, and
        actions in the Service, to ensure security and improve the product.
      </p>
      <h3>Cookies</h3>
      <p>
        We use strictly necessary cookies for authentication and session management, and optional
        cookies for analytics. You can refuse optional cookies in your browser settings.
      </p>

      <h2>3. How we use data</h2>
      <ul>
        <li>To provide and operate the Service;</li>
        <li>To process payments and manage subscriptions (via Paddle);</li>
        <li>To send transactional emails (registration, billing, security alerts);</li>
        <li>To respond to support requests;</li>
        <li>To detect and prevent fraud, abuse, and security incidents;</li>
        <li>To meet legal obligations (accounting, tax, court orders).</li>
      </ul>
      <p>
        We do not sell your personal data. We do not use Customer Data to train machine-learning
        models.
      </p>

      <h2>4. Legal bases</h2>
      <p>
        Where applicable data protection law requires a legal basis, we rely on (a) performance of
        a contract for account and Service operation; (b) legitimate interest for security,
        product improvement, and fraud prevention; (c) consent for optional cookies and marketing
        emails; (d) legal obligation for accounting and tax records.
      </p>

      <h2>5. Sharing data with third parties</h2>
      <p>We share data only with providers that help operate the Service:</p>
      <ul>
        <li>
          <strong>Paddle.com Market Limited</strong> — payment processing and tax compliance
          (Merchant of Record).
        </li>
        <li>
          <strong>Cloud hosting</strong> — to host the Service infrastructure and databases.
        </li>
        <li>
          <strong>Email provider</strong> — to send transactional emails.
        </li>
        <li>
          <strong>Analytics</strong> — privacy-conscious analytics to measure product usage
          (anonymized).
        </li>
      </ul>
      <p>
        These providers are bound by confidentiality and data-processing terms. We may also
        disclose data when required by law or to protect our rights.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Our infrastructure may be hosted in Europe or other regions. When personal data is
        transferred internationally, we rely on appropriate safeguards such as standard
        contractual clauses.
      </p>

      <h2>7. Retention</h2>
      <p>
        We retain account data for the duration of your subscription and for a reasonable period
        afterward to handle billing disputes and meet legal obligations (typically 6&ndash;10
        years for invoices and accounting records). You may request deletion at any time, subject
        to legal retention requirements.
      </p>

      <h2>8. Security</h2>
      <p>
        We protect data with HTTPS encryption in transit, encrypted storage, access controls,
        password hashing, and isolated tenant databases. No system is perfectly secure; in the
        event of a breach affecting personal data, we will notify affected customers and
        authorities as required by law.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, rectify, delete, restrict
        processing, port, or object to processing of your personal data. You may also withdraw
        consent for optional uses (e.g., marketing emails). To exercise these rights, contact{' '}
        <strong>contact@tracksera.com</strong>. We respond within 30 days.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is intended for businesses. We do not knowingly collect personal data from
        children under 16. If you believe a child has provided us data, contact us so we can
        delete it.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy. Material changes will be notified by email or in-product
        notice. The latest version is always available at this URL.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions or to exercise your rights:{' '}
        <strong>contact@tracksera.com</strong>.
      </p>
    </>
  );
}

function BodyFr() {
  return (
    <>
      <p>
        Cette politique de confidentialité explique comment TrackSera
        (&laquo;&nbsp;nous&nbsp;&raquo;) collecte, utilise et protège les données personnelles
        lorsque vous utilisez notre site, créez un compte ou utilisez notre logiciel
        (&laquo;&nbsp;Service&nbsp;&raquo;).
      </p>

      <h2>1. Qui sommes-nous</h2>
      <p>
        TrackSera est un éditeur de logiciel de gestion d&apos;entreprise. Pour toute question
        relative à la confidentialité&nbsp;: <strong>contact@tracksera.com</strong>.
      </p>

      <h2>2. Données collectées</h2>
      <h3>Données de compte</h3>
      <p>
        Lors de la création du compte&nbsp;: nom, nom de l&apos;entreprise, email et/ou téléphone,
        et mot de passe haché.
      </p>
      <h3>Données Client</h3>
      <p>
        Vous saisissez des données métier dans le Service — produits, clients, fournisseurs,
        ventes, factures, etc. Ces données vous appartiennent. Nous les traitons uniquement pour
        fournir le Service.
      </p>
      <h3>Données de paiement</h3>
      <p>
        Les paiements sont traités par <strong>Paddle.com Market Limited</strong> en tant que
        Merchant of Record. Vos coordonnées bancaires sont saisies sur les pages Paddle et ne
        transitent jamais par nos serveurs. Nous recevons uniquement une référence de transaction
        et des métadonnées de facturation.
      </p>
      <h3>Données d&apos;utilisation</h3>
      <p>
        Nous enregistrons des informations techniques&nbsp;: adresse IP, navigateur, appareil,
        pages visitées et actions dans le Service, à des fins de sécurité et d&apos;amélioration
        produit.
      </p>
      <h3>Cookies</h3>
      <p>
        Nous utilisons des cookies strictement nécessaires pour l&apos;authentification et la
        session, et des cookies optionnels pour l&apos;analytique. Vous pouvez refuser les cookies
        optionnels dans votre navigateur.
      </p>

      <h2>3. Finalités</h2>
      <ul>
        <li>Fournir et exploiter le Service&nbsp;;</li>
        <li>Traiter les paiements et gérer les abonnements (via Paddle)&nbsp;;</li>
        <li>Envoyer les emails transactionnels (inscription, facturation, alertes sécurité)&nbsp;;</li>
        <li>Répondre aux demandes de support&nbsp;;</li>
        <li>Détecter et prévenir la fraude, l&apos;abus et les incidents&nbsp;;</li>
        <li>Respecter nos obligations légales (comptabilité, fiscalité, décisions de justice).</li>
      </ul>
      <p>
        Nous ne vendons pas vos données personnelles. Nous n&apos;utilisons pas les Données Client
        pour entraîner des modèles d&apos;intelligence artificielle.
      </p>

      <h2>4. Bases légales</h2>
      <p>
        Lorsque la loi applicable exige une base légale, nous nous appuyons sur&nbsp;: (a)
        l&apos;exécution du contrat pour le compte et le Service&nbsp;; (b) l&apos;intérêt légitime
        pour la sécurité, l&apos;amélioration produit et la prévention de la fraude&nbsp;; (c) le
        consentement pour les cookies optionnels et les emails marketing&nbsp;; (d) les
        obligations légales pour la comptabilité et la fiscalité.
      </p>

      <h2>5. Partage avec des tiers</h2>
      <p>Nous partageons des données uniquement avec les prestataires nécessaires&nbsp;:</p>
      <ul>
        <li>
          <strong>Paddle.com Market Limited</strong> — paiement et conformité fiscale (Merchant of
          Record).
        </li>
        <li><strong>Hébergeur cloud</strong> — infrastructure et bases de données du Service.</li>
        <li><strong>Prestataire email</strong> — envoi des emails transactionnels.</li>
        <li><strong>Analytique</strong> — mesure anonymisée de l&apos;usage produit.</li>
      </ul>
      <p>
        Ces prestataires sont liés par des engagements de confidentialité et de protection des
        données. Nous pouvons aussi divulguer des données si la loi l&apos;exige ou pour protéger
        nos droits.
      </p>

      <h2>6. Transferts internationaux</h2>
      <p>
        Notre infrastructure peut être hébergée en Europe ou dans d&apos;autres régions. Lors
        d&apos;un transfert international de données personnelles, nous nous appuyons sur des
        garanties appropriées telles que les clauses contractuelles types.
      </p>

      <h2>7. Conservation</h2>
      <p>
        Les données de compte sont conservées pendant la durée de votre abonnement et un délai
        raisonnable après (généralement 6 à 10 ans pour les factures et écritures comptables).
        Vous pouvez demander la suppression à tout moment, sous réserve des obligations légales de
        conservation.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous protégeons les données par chiffrement HTTPS en transit, stockage chiffré, contrôles
        d&apos;accès, hachage des mots de passe et bases de données tenant isolées. Aucun système
        n&apos;est parfaitement sécurisé&nbsp;; en cas de violation affectant des données
        personnelles, nous informerons les clients et autorités concernées comme l&apos;exige la
        loi.
      </p>

      <h2>9. Vos droits</h2>
      <p>
        Selon votre juridiction, vous pouvez disposer de droits d&apos;accès, de rectification, de
        suppression, de limitation, de portabilité ou d&apos;opposition. Vous pouvez aussi
        retirer votre consentement aux usages optionnels (emails marketing). Pour exercer ces
        droits&nbsp;: <strong>contact@tracksera.com</strong>. Nous répondons sous 30 jours.
      </p>

      <h2>10. Enfants</h2>
      <p>
        Le Service est destiné aux entreprises. Nous ne collectons pas sciemment de données
        personnelles d&apos;enfants de moins de 16 ans. Si vous pensez qu&apos;un mineur nous a
        fourni des données, contactez-nous pour suppression.
      </p>

      <h2>11. Modifications</h2>
      <p>
        Nous pouvons modifier cette politique. Les changements importants seront notifiés par
        email ou dans le produit. La dernière version est toujours disponible à cette URL.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question ou pour exercer vos droits&nbsp;: <strong>contact@tracksera.com</strong>.
      </p>
    </>
  );
}

function BodyAr() {
  return (
    <>
      <p>
        توضح سياسة الخصوصية هذه كيف تقوم TrackSera (&quot;نحن&quot;) بجمع البيانات الشخصية
        واستخدامها وحمايتها عند استخدامك لموقعنا أو إنشاء حساب أو استخدام خدمتنا
        (&quot;الخدمة&quot;).
      </p>

      <h2>1. من نحن</h2>
      <p>
        TrackSera هي شركة تطوير برمجيات لإدارة الأعمال. لأي استفسار حول الخصوصية&nbsp;:{' '}
        <strong>contact@tracksera.com</strong>.
      </p>

      <h2>2. البيانات التي نجمعها</h2>
      <h3>بيانات الحساب</h3>
      <p>
        عند إنشاء الحساب&nbsp;: الاسم، اسم الشركة، البريد الإلكتروني و/أو رقم الهاتف، وكلمة المرور
        المُشفّرة.
      </p>
      <h3>بيانات العميل</h3>
      <p>
        تُدخل في الخدمة بيانات تجارية مثل المنتجات والعملاء والموردين والمبيعات والفواتير. هذه
        البيانات ملكك. نعالجها فقط لتقديم الخدمة.
      </p>
      <h3>بيانات الدفع</h3>
      <p>
        تتم معالجة المدفوعات عبر <strong>Paddle.com Market Limited</strong> بصفته Merchant of
        Record. تُدخل معلومات البطاقة في صفحات Paddle ولا تصل إلى خوادمنا أبداً. نتلقى فقط مرجع
        المعاملة وبيانات الفوترة.
      </p>
      <h3>بيانات الاستخدام</h3>
      <p>
        نسجّل معلومات تقنية مثل عنوان IP، المتصفح، الجهاز، الصفحات المُزارة، والإجراءات داخل
        الخدمة، لأغراض الأمان وتحسين المنتج.
      </p>
      <h3>الكوكيز</h3>
      <p>
        نستخدم كوكيز ضرورية للمصادقة وإدارة الجلسة، وكوكيز اختيارية للتحليلات. يمكنك رفض الكوكيز
        الاختيارية من إعدادات المتصفح.
      </p>

      <h2>3. كيف نستخدم البيانات</h2>
      <ul>
        <li>تقديم وتشغيل الخدمة؛</li>
        <li>معالجة المدفوعات وإدارة الاشتراكات (عبر Paddle)؛</li>
        <li>إرسال رسائل المعاملات (التسجيل، الفوترة، تنبيهات الأمان)؛</li>
        <li>الرد على طلبات الدعم؛</li>
        <li>اكتشاف ومنع الاحتيال والإساءة وحوادث الأمن؛</li>
        <li>الوفاء بالالتزامات القانونية (المحاسبة، الضرائب، الأوامر القضائية).</li>
      </ul>
      <p>
        لا نبيع بياناتك الشخصية. لا نستخدم بيانات العميل لتدريب نماذج الذكاء الاصطناعي.
      </p>

      <h2>4. الأسس القانونية</h2>
      <p>
        حيث يستوجب القانون أساساً قانونياً، نعتمد على&nbsp;: (أ) تنفيذ العقد لتشغيل الحساب
        والخدمة؛ (ب) المصلحة المشروعة للأمن وتحسين المنتج ومنع الاحتيال؛ (ج) الموافقة لاستخدام
        الكوكيز الاختيارية ورسائل التسويق؛ (د) الالتزام القانوني للسجلات المحاسبية والضريبية.
      </p>

      <h2>5. مشاركة البيانات مع أطراف ثالثة</h2>
      <p>نشارك البيانات فقط مع مزوّدي الخدمات الضروريين&nbsp;:</p>
      <ul>
        <li><strong>Paddle.com Market Limited</strong> — معالجة المدفوعات والامتثال الضريبي.</li>
        <li><strong>الاستضافة السحابية</strong> — البنية التحتية وقواعد البيانات.</li>
        <li><strong>مزوّد البريد الإلكتروني</strong> — إرسال الرسائل التشغيلية.</li>
        <li><strong>التحليلات</strong> — قياس الاستخدام بشكل مجهول الهوية.</li>
      </ul>
      <p>
        يلتزم هؤلاء المزوّدون بالسرية وحماية البيانات. قد نُفصح عن البيانات أيضاً عند اشتراط
        القانون ذلك أو لحماية حقوقنا.
      </p>

      <h2>6. النقل الدولي</h2>
      <p>
        قد تُستضاف بنيتنا التحتية في أوروبا أو مناطق أخرى. عند نقل البيانات الشخصية دولياً، نعتمد
        على ضمانات مناسبة كالشروط التعاقدية الموحدة.
      </p>

      <h2>7. مدة الاحتفاظ</h2>
      <p>
        نحتفظ ببيانات الحساب طوال مدة اشتراكك ولفترة معقولة بعدها لمعالجة نزاعات الفوترة وتلبية
        الالتزامات القانونية (عادة 6&ndash;10 سنوات للفواتير والسجلات المحاسبية). يمكنك طلب
        الحذف في أي وقت رهناً بمتطلبات الاحتفاظ القانونية.
      </p>

      <h2>8. الأمن</h2>
      <p>
        نحمي البيانات بالتشفير HTTPS أثناء النقل، والتخزين المُشفَّر، وضوابط الوصول، وتشفير كلمات
        المرور، وعزل قواعد بيانات العملاء. في حال وقوع خرق يؤثر على بيانات شخصية، سنخطر العملاء
        والجهات المختصة وفق ما يستوجبه القانون.
      </p>

      <h2>9. حقوقك</h2>
      <p>
        قد يكون لك بحسب ولايتك القضائية حق الوصول، التصحيح، الحذف، تقييد المعالجة، النقل، أو
        الاعتراض. يمكنك أيضاً سحب موافقتك على الاستخدامات الاختيارية. للتواصل بشأن حقوقك&nbsp;:{' '}
        <strong>contact@tracksera.com</strong>. نرد خلال 30 يوماً.
      </p>

      <h2>10. الأطفال</h2>
      <p>
        الخدمة موجّهة للشركات. لا نجمع عن قصد بيانات شخصية لأطفال دون سن 16. إذا اعتقدت أن قاصراً
        قدّم لنا بيانات، تواصل معنا لحذفها.
      </p>

      <h2>11. تعديل السياسة</h2>
      <p>
        قد نُحدّث هذه السياسة. تُبلَّغ التغييرات الجوهرية بالبريد أو داخل المنتج. تتوفر النسخة
        الأحدث دائماً في هذا الرابط.
      </p>

      <h2>12. التواصل</h2>
      <p>
        للأسئلة أو ممارسة حقوقك&nbsp;: <strong>contact@tracksera.com</strong>.
      </p>
    </>
  );
}
