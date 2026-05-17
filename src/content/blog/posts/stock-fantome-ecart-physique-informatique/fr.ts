import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Stock fantôme — pourquoi votre stock physique ≠ votre Excel',
  excerpt: 'Tous les distributeurs découvrent un jour l\'écart qui fait mal : le stock réel ne correspond pas à celui du système. Voici les vraies causes et la solution qui met fin au problème.',
  tags: ['Stock', 'Inventaire', 'Entrepôt', 'Contrôle', 'Écarts'],
  content: `
<p class="lead">Vous faites l'inventaire de fin de trimestre. Votre Excel dit : <strong>1 840 cartons</strong>. Le physique dit : <strong>1 713 cartons</strong>. Écart : 127 cartons. À 2 800 DA l'unité, vous venez de découvrir un trou de <span class="highlight-blue">355 600 DA</span> dans votre inventaire. D'où vient-il ? Personne ne sait. Et c'est précisément ça, le problème du stock fantôme.</p>

<h2>Le stock fantôme, c'est quoi exactement ?</h2>

<p>C'est l'écart — souvent inexplicable à première vue — entre :</p>

<ul class="check-list">
  <li>Le <strong>stock théorique</strong> (ce que dit votre système, Excel ou logiciel)</li>
  <li>Le <strong>stock physique</strong> (ce qui est vraiment dans vos rayons et chambres froides)</li>
</ul>

<div class="info-box">
  <div class="box-title">💡 Un chiffre universel</div>
  <p>Toutes les études logistiques sérieuses le confirment : dans une distribution non digitalisée, l'écart moyen entre stock théorique et stock physique est de <strong>6 à 12% en valeur</strong>. Pour un distributeur qui brasse 500 millions DA/an, cela représente <strong>30 à 60 millions DA "fantômes" chaque année</strong>.</p>
</div>

<h2>Les 7 vraies causes du stock fantôme</h2>

<h3>1. Les livraisons partiellement reçues mais totalement saisies</h3>
<p>Votre fournisseur livre 500 cartons mais il en manque 12 dans le chargement. Votre magasinier, pressé, signe le bon de livraison sans vérifier et saisit 500 dans le système. Les 12 cartons n'existent que dans l'Excel — c'est du stock fantôme pur.</p>

<h3>2. Les produits vendus mais non déchargés du stock</h3>
<p>Un livreur part avec 50 cartons. Il en vend 47 et ramène 3. Au retour, personne ne rentre le mouvement dans le système — ou on le fait deux jours plus tard avec des chiffres approximatifs. Résultat : le système croit toujours que vous avez 50 cartons disponibles.</p>

<h3>3. Les casses non déclarées</h3>
<p>Un carton tombe, 2 bouteilles cassées. C'est courant. Le problème : souvent, personne ne sort les 2 bouteilles du système comptable. Elles restent en "stock théorique" pour toujours.</p>

<div class="warning-box">
  <div class="box-title">⚠️ La casse, c'est 1 à 3% du CA</div>
  <p>Dans les boissons, les produits frais, le verre : la casse annuelle représente 1 à 3% du chiffre d'affaires. Si elle n'est pas tracée, c'est autant de stock fantôme qui s'accumule mois après mois.</p>
</div>

<h3>4. Les "prêts" informels entre magasins</h3>
<p>"Prête-moi 20 cartons, je te les rends demain." Bien sûr, personne ne les rend jamais vraiment, et personne ne saisit le transfert dans le système. Les magasins se transfèrent du stock fantôme entre eux.</p>

<h3>5. Les erreurs de codes-barres ou de références</h3>
<p>Vous avez 3 références très proches (Huile 1L, Huile 2L, Huile 5L). Le magasinier scanne la mauvaise au déchargement. Le système enlève du 1L au lieu du 5L. Deux erreurs d'un coup : excédent fantôme sur un produit, manque fantôme sur l'autre.</p>

<h3>6. Les retours clients pas ou mal traités</h3>
<p>Un client retourne 5 cartons "cassés en route". Le livreur les ramène. Le magasinier les met dans un coin "à trier". Trois semaines plus tard, ils sont oubliés — ni remis en stock vendable, ni comptabilisés en casse. <strong>Stock fantôme.</strong></p>

<h3>7. Le vol simple</h3>
<p>C'est la cause la plus désagréable à admettre, mais la plus fréquente dans les gros écarts. Pas nécessairement un vol de grande envergure : 2 cartons qui "tombent du camion" chaque semaine × 52 semaines × 3 500 DA = <strong>364 000 DA/an</strong>.</p>

<h2>Comment savoir si vous êtes touché (vous l'êtes)</h2>

<p>La question n'est pas <em>"ai-je du stock fantôme ?"</em>. Tous les distributeurs en ont. La vraie question est : <strong>combien, et où ?</strong></p>

<div class="purple-box">
  <div class="box-title">🔍 Le diagnostic express</div>
  <p>Faites un inventaire complet sur <strong>une seule famille de produits</strong> (par exemple : toutes les huiles). Comparez au stock théorique. Calculez l'écart en %. Extrapolez sur l'ensemble de votre stock. Vous aurez en 2 heures une estimation honnête de votre trou fantôme total.</p>
</div>

<p>Dans 95% des cas, le résultat fait mal. Mais c'est le premier pas vers une vraie solution.</p>

<h2>Pourquoi Excel ne peut PAS résoudre ça</h2>

<p>Excel est un outil génial, mais il a trois défauts mortels pour le suivi de stock :</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">🙈</div>
    <h4>Pas de temps réel</h4>
    <p>Les modifications sont saisies le soir ou le lendemain — les écarts s'accumulent avant détection</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">❌</div>
    <h4>Pas de contrôle</h4>
    <p>N'importe qui peut modifier n'importe quelle cellule. Aucune traçabilité.</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">📵</div>
    <h4>Pas de lien terrain</h4>
    <p>Le livreur ne peut pas mettre à jour le stock depuis son téléphone en temps réel</p>
  </div>
</div>

<h2>La solution : un flux unique de stock, fermé de bout en bout</h2>

<p>Pour tuer le stock fantôme, il faut qu'aucun mouvement ne puisse exister <strong>hors du système</strong>. Concrètement :</p>

<ol class="numbered-list">
  <li><strong>Réception fournisseur</strong> : le magasinier scanne et compte, l'écart avec le bon de commande est affiché immédiatement</li>
  <li><strong>Transfert entre entrepôts</strong> : un bouton dans l'app, traçabilité totale, impossible de faire un "prêt oral"</li>
  <li><strong>Chargement camion</strong> : tout ce qui sort du dépôt est pointé dans le stock "en tournée"</li>
  <li><strong>Vente terrain</strong> : chaque vente déduit instantanément le stock du camion</li>
  <li><strong>Retour dépôt</strong> : ce qui revient est ré-intégré, les écarts sont calculés automatiquement</li>
  <li><strong>Casse et perte</strong> : saisie obligatoire avec photo et motif, pas de "trou noir" possible</li>
  <li><strong>Inventaire périodique</strong> : réconciliation automatique, écarts marqués et attribués à un responsable</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 L'effet "transparence"</div>
  <p>Dès que tout est tracé, <strong>le stock fantôme chute de 70 à 90% en un mois</strong>. Pas parce que les gens sont devenus honnêtes du jour au lendemain — mais parce que chaque geste a désormais une conséquence visible. L'effet de dissuasion est massif.</p>
</div>

<h2>Ce que TrackSera fait différemment</h2>

<p>Notre module stock a été conçu après 6 mois d'observation dans des entrepôts algériens réels. Pas depuis un bureau. Concrètement :</p>

<ul class="check-list">
  <li>Stock <strong>en temps réel</strong> synchronisé entre dépôt, camion, et tablette livreur</li>
  <li>Multi-entrepôts : vous voyez où est chaque produit à la seconde près</li>
  <li>Code-barres et scan intégrés — fin des erreurs de référence</li>
  <li>Saisie obligatoire de la casse avec photo et motif</li>
  <li>Rapports d'écart automatiques à chaque fin de tournée</li>
  <li>Historique total : qui a modifié quoi, quand, depuis où</li>
  <li>Alertes seuil critique pour anticiper les ruptures (voir <a href="/blog/tableau-de-bord-distributeur-5-chiffres">les 5 chiffres du dashboard</a>)</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ Retrouvez votre argent</div>
  <p>Récupérer 80% du stock fantôme, c'est l'équivalent de 2 à 4% de marge supplémentaire sur tout votre business. Pour un distributeur moyen, ça paie TrackSera <strong>30 fois sur l'année</strong>. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Commencer maintenant →</a></p>
</div>

<hr class="divider"/>

<p><em>À lire aussi : <a href="/blog/livreur-vol-distribution-7-signaux">7 signaux d'un livreur malhonnête</a>, <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 chiffres à regarder chaque matin</a>, et <a href="/blog/optimiser-tournee-livraison-6-regles">6 règles pour optimiser une tournée</a>.</em></p>
`,
};

export default data;
