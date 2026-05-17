import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'CashVan : la révolution silencieuse de la distribution en Algérie',
  excerpt:
    "Comment la vente mobile depuis le camion a changé le visage de la distribution en Algérie, et pourquoi c'est devenu la solution de référence pour des milliers de distributeurs, de Batna à Tlemcen.",
  tags: ['CashVan', 'Vente mobile', 'Distribution', 'Terrain'],
  content: `
<p class="lead">Il y a dix ans, un vendeur prenait les commandes dans un cahier, rentrait le soir au dépôt, le patron tapait tout sur Excel, le magasinier préparait pour le lendemain, et le livreur repartait deux jours plus tard. <span class="highlight-blue">Résultat : 3 jours entre la commande et la livraison.</span> Aujourd'hui, c'est 30 minutes. Bienvenue dans l'ère du CashVan.</p>

<h2>C'est quoi exactement, le CashVan ?</h2>

<p>Le principe est simple : le camion devient un point de vente mobile. Le vendeur-livreur charge le stock le matin, visite sa tournée, et à chaque client il :</p>

<ol class="numbered-list">
  <li><strong>Sélectionne les produits</strong> directement sur sa tablette ou son smartphone</li>
  <li><strong>Applique la tarification du client</strong> (grossiste, détaillant, promotion)</li>
  <li><strong>Imprime un bon de livraison / facture</strong> en direct, signé et remis au client</li>
  <li><strong>Encaisse le paiement</strong> — cash, chèque, à terme, ou mix</li>
  <li><strong>Décrémente le stock du camion</strong> automatiquement</li>
  <li><strong>Passe au client suivant</strong> sans retour au dépôt</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 L'intuition clé</div>
  <p>Le CashVan fusionne trois métiers en un : <strong>vendeur, livreur, et caissier</strong>. Là où une organisation classique demande trois équipes et deux jours, un seul homme fait tout en une matinée.</p>
</div>

<h2>Pourquoi ça explose en Algérie</h2>

<p>Le CashVan n'est pas nouveau dans le monde. Coca-Cola, Pepsi et Danone l'utilisent depuis les années 90 en Europe. Mais en Algérie, trois facteurs ont rendu 2024-2026 la vraie décennie du CashVan :</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">📡</div>
    <h4>4G partout</h4>
    <p>Couverture nationale stable, même dans les petites wilayas</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#d1fae5;color:#065f46">📱</div>
    <h4>Smartphones à bas prix</h4>
    <p>Android à 15 000 DA permet d'équiper toute une flotte</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">🏪</div>
    <h4>Concurrence féroce</h4>
    <p>Les commerces détaillants veulent être servis vite ou ils changent de fournisseur</p>
  </div>
</div>

<h2>Les gains concrets, chiffres à l'appui</h2>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#3b82f6">+40%</div>
    <div class="stat-label">Clients visités par jour</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">-60%</div>
    <div class="stat-label">Temps administratif au bureau</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#f59e0b">+25%</div>
    <div class="stat-label">Chiffre d'affaires moyen par tournée</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#8b5cf6">-90%</div>
    <div class="stat-label">Erreurs de facturation</div>
  </div>
</div>

<p>Ces chiffres ne sont pas théoriques. Ils viennent de distributeurs qui ont basculé d'un système "cahier + livraison décalée" vers un CashVan équipé. Un distributeur de produits laitiers à Médéa nous disait : <em>"avant, je finissais ma tournée à 17h avec 40 clients. Maintenant c'est 14h avec 55 clients."</em></p>

<h2>Les 4 erreurs à ne pas faire</h2>

<div class="warning-box">
  <div class="box-title">❌ Démarrer sans app fiable hors ligne</div>
  <p>Votre vendeur sera dans des zones sans 4G. L'app doit fonctionner, synchroniser au retour et ne jamais perdre une vente.</p>
</div>

<div class="warning-box">
  <div class="box-title">❌ Donner la même tarification à tout le monde</div>
  <p>Gérez les niveaux de prix (grossiste, semi-gros, détail, promotion du jour). Sinon vous brûlez votre marge.</p>
</div>

<div class="warning-box">
  <div class="box-title">❌ Oublier la réconciliation du cash</div>
  <p>Le soir, l'argent encaissé par le vendeur doit coller au centime près avec ce que le système a enregistré. Un bon logiciel bloque la clôture tant que ça ne correspond pas.</p>
</div>

<div class="warning-box">
  <div class="box-title">❌ Laisser le vendeur sans tracking</div>
  <p>GPS sur l'app, visibilité en direct depuis le bureau. Ce n'est pas de la méfiance — c'est de la sécurité et de la preuve en cas de litige client.</p>
</div>

<h2>Le module CashVan de TrackSera</h2>

<p>Nous avons construit notre module CashVan en travaillant avec trois distributeurs pilotes pendant six mois. Voici ce qu'il fait :</p>

<ul class="check-list">
  <li>App Android dédiée au vendeur, fonctionne 100% hors ligne</li>
  <li>Chargement du camion le matin avec le stock de départ</li>
  <li>Visite client : prix client appliqué automatiquement, remises autorisées selon rôle</li>
  <li>Facture PDF générée et envoyée par WhatsApp au client en un clic</li>
  <li>Encaissement multi-mode : cash, chèque, à terme, virement</li>
  <li>Réconciliation fin de journée : stock restant + cash encaissé = vérifié par le système</li>
  <li>Tracking GPS visible depuis le tableau de bord du patron</li>
  <li>Rapport de tournée : clients visités, clients absents, ventes, marge</li>
</ul>

<hr class="divider"/>

<div class="purple-box">
  <div class="box-title">🚀 Envie d'essayer le CashVan ?</div>
  <p>Nous équipons votre premier camion en 48h. Démo sur site gratuite dans toute l'Algérie. <a href="/#contact" style="color:#5b21b6;font-weight:700;text-decoration:underline">Demander une démo →</a></p>
</div>
`,
};

export default data;
