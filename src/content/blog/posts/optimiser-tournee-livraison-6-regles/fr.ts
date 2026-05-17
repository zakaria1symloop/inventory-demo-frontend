import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Optimiser une tournée de livraison — 6 règles pour gagner 2h/jour',
  excerpt: 'Une tournée mal planifiée coûte du gasoil, du temps et des clients. Six règles concrètes pour réorganiser vos tournées et doubler leur efficacité dès la première semaine.',
  tags: ['Tournée', 'Livraison', 'Logistique', 'Optimisation', 'Gasoil'],
  content: `
<p class="lead">Votre livreur part à 7h30 avec 38 clients à visiter. Il rentre à 19h, fatigué, avec 6 livraisons non faites. Le problème n'est <strong>presque jamais</strong> le livreur — c'est la tournée qu'on lui a donnée. Voici <span class="highlight-blue">6 règles simples</span> qui font gagner, en moyenne, <strong>2 heures par jour et par camion</strong> aux distributeurs qu'on accompagne.</p>

<h2>Règle 1 — Grouper par zone géographique, pas par type de client</h2>

<p>L'erreur classique : construire la tournée en regardant votre fichier Excel trié par ordre alphabétique ou par catégorie ("d'abord tous les cafés, puis tous les restaurants"). Résultat : le livreur zigzague à travers la ville toute la journée.</p>

<div class="info-box">
  <div class="box-title">💡 La bonne approche</div>
  <p>Découpez la ville en <strong>4 à 6 zones</strong> logiques (cadrans, quartiers, axes). Chaque tournée visite <strong>une seule zone</strong> — ou deux zones adjacentes. Jamais trois.</p>
</div>

<p>Pour Biskra par exemple : Zone Nord (Chetma, Sidi Ghezal), Zone Centre (Vieille ville, El Alia), Zone Ouest (Biskra Ouest, Birsa), Zone Sud (Sidi Okba, Zeribet El Oued), etc. Un camion = une zone = une matinée.</p>

<h2>Règle 2 — Commencer par le client le plus éloigné</h2>

<p>C'est contre-intuitif. La plupart des tournées commencent par le client le plus proche. Erreur : vous finissez la journée à l'autre bout de la ville, épuisé, avec la circulation de 17h.</p>

<div class="purple-box">
  <div class="box-title">📐 La règle de l'arc</div>
  <p>Dessinez un <strong>arc</strong> : allez au point le plus éloigné en premier (tôt le matin, circulation fluide, livreur frais), puis revenez progressivement vers le dépôt en livrant les clients sur le chemin. Fin de tournée à côté du dépôt = retour rapide = moins de fatigue.</p>
</div>

<h2>Règle 3 — Regrouper les clients "lents" sur un créneau spécifique</h2>

<p>Dans chaque tournée, il y a toujours <strong>2 ou 3 clients</strong> qui prennent 30-45 minutes chacun au lieu des 8 minutes standard. Raisons : magasinier absent, paiement compliqué, déchargement manuel, discussion obligatoire avec le patron.</p>

<p>Si vous les dispersez dans la tournée, ils cassent tout le rythme. Si vous les regroupez sur un <strong>créneau fixe</strong> (par exemple 10h-11h30 le mardi), le livreur sait à quoi s'attendre et compense avant et après.</p>

<h2>Règle 4 — Éliminer les "trous" dans la tournée</h2>

<p>Un "trou" c'est un client que votre livreur visite mais qui n'a <strong>presque jamais</strong> commandé. Tous les distributeurs en ont. On n'ose pas les retirer "au cas où".</p>

<div class="warning-box">
  <div class="box-title">⚠️ Le calcul brutal</div>
  <p>Faites le test : sur 90 jours, combien de visites chez ce client ont généré une commande ? Si c'est <strong>moins de 30%</strong>, arrêtez d'y passer systématiquement. Appelez avant de venir. Ou passez tous les 15 jours au lieu d'à chaque tournée.</p>
</div>

<p>Un client "fantôme" qui vous coûte 15 minutes par visite, à raison de 5 visites inutiles par mois, c'est <strong>1h15 par mois perdue</strong>. Pour un seul client. Multipliez par 6 ou 7 clients fantômes et vous récupérez une demi-journée de travail chaque mois.</p>

<h2>Règle 5 — Anticiper le chargement exact la veille</h2>

<p>Chargement du matin = moment perdu. Le livreur arrive à 7h, attend le magasinier, attend les étiquettes, attend un oubli. Il part à 8h30 au lieu de 7h30. Une heure perdue tous les jours = <strong>260 heures par an</strong>, soit un mois entier de travail.</p>

<p>La solution : préparer le chargement <strong>la veille au soir</strong>, sur la base des commandes confirmées. Le matin, le livreur arrive, charge en 15 minutes, part. C'est tout.</p>

<ul class="check-list">
  <li>Bon de chargement généré la veille à 17h</li>
  <li>Produits préparés et filmés sur palette dans la zone "départ demain"</li>
  <li>Matinée : vérification rapide, signature, départ en 15 minutes</li>
  <li>Livreur arrive chez le premier client à 8h au lieu de 9h30</li>
</ul>

<h2>Règle 6 — Mesurer et ajuster chaque semaine</h2>

<p>La tournée parfaite n'existe pas le premier jour. Elle se construit par <strong>petites corrections hebdomadaires</strong>, basées sur des données réelles :</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">⏱️</div>
    <h4>Temps moyen par client</h4>
    <p>Si un client dépasse systématiquement 20 min, comprendre pourquoi</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">⛽</div>
    <h4>Consommation gasoil</h4>
    <p>Km parcourus ÷ nombre de clients visités</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">❌</div>
    <h4>Taux d'échec</h4>
    <p>Livraisons non faites par zone et par jour</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">📞</div>
    <h4>Appels terrain</h4>
    <p>Combien d'appels "client pas là, que faire ?" par tournée</p>
  </div>
</div>

<h2>Le cas réel : un distributeur de boissons à Constantine</h2>

<p>Situation de départ (janvier 2026) :</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">11h30</div>
    <div class="stat-label">Durée moyenne d'une tournée</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">28</div>
    <div class="stat-label">Clients visités en moyenne</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">4-7</div>
    <div class="stat-label">Livraisons non faites / jour</div>
  </div>
</div>

<p>Après application des 6 règles (6 semaines) :</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">9h20</div>
    <div class="stat-label">Durée moyenne (-2h10)</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">34</div>
    <div class="stat-label">Clients visités (+21%)</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">&lt;1</div>
    <div class="stat-label">Livraison non faite / jour</div>
  </div>
</div>

<p>Même livreur. Même camion. Même ville. Juste une tournée <strong>bien pensée</strong>. Résultat : plus de CA, moins de fatigue, moins de gasoil, et des clients plus contents.</p>

<h2>Comment TrackSera aide concrètement</h2>

<p>Construire tout ça sur Excel est possible, mais vous passez plus de temps à optimiser qu'à livrer. Notre module tournées automatise :</p>

<ul class="check-list">
  <li>Regroupement automatique des clients par zone</li>
  <li>Suggestion d'ordre de visite (arc géographique)</li>
  <li>Préparation du bon de chargement la veille au soir</li>
  <li>Détection des clients "fantômes" (faible taux de commande)</li>
  <li>Rapport hebdo avec les 4 indicateurs de performance</li>
  <li>Historique GPS pour voir où le temps a vraiment été passé</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ 2 heures par jour, 40 heures par mois</div>
  <p>C'est une semaine entière de travail récupérée chaque mois, par camion. Sur 5 camions, vous avez un livreur "gratuit". <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Commencer gratuitement →</a></p>
</div>

<hr class="divider"/>

<p><em>À lire aussi : <a href="/blog/suivi-gps-livreurs-algerie-2026">Le suivi GPS en Algérie en 2026</a> et <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 chiffres à regarder chaque matin</a>.</em></p>
`,
};

export default data;
