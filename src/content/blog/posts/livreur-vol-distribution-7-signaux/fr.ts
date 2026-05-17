import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Comment savoir si mon livreur me vole — 7 signaux clairs + la solution',
  excerpt:
    "Tous les distributeurs algériens se posent la question : mon livreur est-il honnête ? Voici 7 signaux concrets qui trahissent un détournement, et comment y mettre fin en deux semaines.",
  tags: ['Gestion livreurs', 'Suivi GPS', 'Stock', 'CashVan', 'Contrôle'],
  content: `
<p class="lead">Vous chargez un camion avec 420 cartons. Le soir, le livreur rentre avec <strong>2 300 DA de moins que prévu</strong> et une explication floue. Ce n'est pas la première fois. Avant d'accuser qui que ce soit, voici <span class="highlight-blue">7 signaux concrets</span> qui révèlent un détournement — et comment y mettre fin sans drame.</p>

<h2>1. L'écart de caisse qui revient tous les vendredis</h2>
<p>Un écart ponctuel, ça arrive : une pièce tombée, un client qui a rendu trop peu. Mais quand l'écart est <strong>récurrent, toujours dans le même sens</strong> (jamais à votre faveur) et toujours le même jour de la semaine, ce n'est plus le hasard.</p>

<div class="info-box">
  <div class="box-title">💡 Le test simple</div>
  <p>Relevez les écarts de caisse par livreur sur 30 jours. Triez. Si un livreur concentre <strong>plus de 60% des écarts négatifs</strong> alors qu'il fait 20% des tournées, vous avez votre réponse.</p>
</div>

<h2>2. Des "retours" qui n'ont jamais existé</h2>
<p>Un classique : le livreur déclare que le client a refusé la marchandise. Il la "retourne" au dépôt. Sauf que ce retour n'est jamais inventorié, ou il est inventorié plus tard dans la semaine, dans des quantités différentes.</p>
<p>Demandez à votre magasinier : chaque retour doit être pesé, compté, et signé <strong>le jour même</strong>. Si un livreur a 3-4 retours par semaine alors que la moyenne est de 0,5, creusez.</p>

<h2>3. Des clients "qui paient toujours cash" mais que vous n'arrivez jamais à joindre</h2>
<p>Le scénario : le livreur encaisse en espèces, vous dit que M. Belkacem a payé, mais quand vous appelez M. Belkacem trois semaines plus tard pour autre chose, celui-ci tombe des nues — il a payé par chèque, ou il n'a jamais reçu la commande.</p>

<div class="warning-box">
  <div class="box-title">⚠️ Le red flag absolu</div>
  <p>Un livreur qui <strong>refuse</strong> que vous appeliez ses clients "parce que ça va les déranger" cache quelque chose. Appelez-les quand même. Poliment. Directement.</p>
</div>

<h2>4. Des tournées qui durent 3 heures de trop</h2>
<p>Un parcours Biskra → Tolga → Sidi Okba → retour dépôt devrait prendre 4h30. Votre livreur rentre à 19h alors qu'il est parti à 8h. Où sont passées les 5 heures manquantes ?</p>
<p>Sans GPS, vous n'avez <strong>aucun moyen</strong> de le savoir. Avec un suivi en temps réel, vous voyez :</p>
<ul class="check-list">
  <li>Les arrêts prolongés non justifiés (pause-café de 90 minutes ?)</li>
  <li>Les détours vers des adresses qui ne sont pas sur la tournée</li>
  <li>Les zones "mortes" où le camion reste immobile sans client à visiter</li>
</ul>

<h2>5. Le stock "qui s'évapore" entre le chargement et le retour</h2>
<p>Le chargement du matin est noté : 420 cartons. Le retour du soir est noté : 12 cartons (non vendus). Les ventes déclarées : 405 cartons. <strong>Il manque 3 cartons.</strong></p>
<p>Un carton qui "disparaît", ça peut être une erreur. Trois cartons par semaine, c'est 12 par mois, 144 par an. À 3 500 DA le carton, vous venez de perdre <strong>504 000 DA</strong>. Pour un seul livreur.</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">144</div>
    <div class="stat-label">Cartons perdus par an sur 1 livreur</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">504K DA</div>
    <div class="stat-label">Perte sèche annuelle</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">3×</div>
    <div class="stat-label">Si vous avez 3 livreurs concernés</div>
  </div>
</div>

<h2>6. Les prix "négociés" qui ne devraient pas exister</h2>
<p>Un livreur qui vend à 95 DA un produit tarifé à 100 DA et empoche la différence, ou qui applique une "remise spéciale" sur 20 cartons et encaisse la remise en cash à côté. Le client paie le prix normal, le livreur prend 100 DA × 20 = 2 000 DA dans sa poche.</p>
<p>Seul un <strong>tarif produit verrouillé dans l'application</strong> empêche ce scénario. Si le livreur ne peut pas saisir un prix inférieur, il ne peut pas voler sur le prix.</p>

<h2>7. L'absence totale de justificatif</h2>
<p>Pas de bon de livraison signé. Pas de reçu. Pas de photo. "C'est un vieux client, il me fait confiance." Quand un livreur multiplie les livraisons <strong>sans preuve</strong>, vous n'avez aucun recours le jour où le client conteste.</p>

<div class="purple-box">
  <div class="box-title">📐 Règle d'or</div>
  <p>Aucune livraison ne quitte votre système sans : <strong>signature du client OU photo du bon signé OU géolocalisation de la livraison</strong>. Les trois ensemble si possible.</p>
</div>

<h2>La solution : fermer toutes les portes en même temps</h2>

<p>Traquer chaque signal manuellement est épuisant. Le vrai remède, c'est de rendre le vol <strong>techniquement impossible</strong>. C'est exactement ce que TrackSera fait :</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">📍</div>
    <h4>GPS en temps réel</h4>
    <p>Vous voyez où est chaque camion, ses arrêts, ses détours</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">📦</div>
    <h4>Chargement verrouillé</h4>
    <p>Tout le stock du camion est dans l'app. Impossible de "perdre" un carton sans laisser trace</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">💰</div>
    <h4>Prix verrouillés</h4>
    <p>Le livreur ne peut jamais saisir un prix inférieur à celui défini au bureau</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">✍️</div>
    <h4>Signature + photo</h4>
    <p>Chaque livraison est signée sur l'écran et géolocalisée à l'instant T</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">📊</div>
    <h4>Rapport d'écarts</h4>
    <p>Le dashboard liste automatiquement les écarts chargement ↔ retour par livreur</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#e0f2fe;color:#075985">🧾</div>
    <h4>Encaissements tracés</h4>
    <p>Chaque paiement est horodaté, rattaché au client, et fermé le soir avec la caisse</p>
  </div>
</div>

<h2>Ce que nos clients voient en 2 semaines</h2>

<ul class="check-list">
  <li>Les écarts de caisse <strong>chutent de 70 à 95%</strong> dès la première semaine (effet dissuasion)</li>
  <li>Les tournées deviennent 20 à 40% plus rapides (fini les "arrêts-café")</li>
  <li>Les livreurs honnêtes sont ravis : ils sont enfin protégés des accusations injustes</li>
  <li>Les livreurs malhonnêtes démissionnent d'eux-mêmes — c'est le signal le plus clair</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ Le mot de la fin</div>
  <p>Vous ne cherchez pas à punir vos livreurs. Vous cherchez à savoir ce qui se passe vraiment sur le terrain. Avec les bons outils, vous n'avez plus à deviner — vous savez. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Essayez TrackSera gratuitement 14 jours →</a></p>
</div>

<hr class="divider"/>

<p><em>À lire aussi : <a href="/blog/cashvan-vente-mobile-distribution-algerie">Le guide CashVan — la vente mobile en Algérie</a> et <a href="/blog/logiciel-gestion-distribution-algerie-2026">Comment choisir son logiciel de distribution en 2026</a>.</em></p>
`,
};

export default data;
