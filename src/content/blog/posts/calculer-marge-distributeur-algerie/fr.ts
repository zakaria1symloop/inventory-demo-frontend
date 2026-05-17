import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: "Comment calculer la marge d'un distributeur en Algérie : formules et pièges",
  excerpt:
    'La confusion entre marge, marque et profit ruine beaucoup de distributeurs. Voici les bonnes formules et les benchmarks par secteur en Algérie.',
  tags: ['Marge', 'Rentabilité', 'Finance', 'Distributeur', 'Guide'],
  content: `
<p class="lead">"J'ai vendu pour 50 millions ce mois, mais où est l'argent ?" <span class="highlight-blue">C'est la question que tout distributeur algérien finit par se poser.</span> La réponse tient dans un seul chiffre que peu maîtrisent vraiment : la marge. Voici comment la calculer correctement.</p>

<h2>Marge brute, marque, profit : ne plus confondre</h2>

<p>Trois mots, trois calculs différents :</p>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">📊 Marge brute</div>
    <p>Profit ÷ <strong>Prix de vente</strong>. Exprimée en % du chiffre d'affaires. C'est <em>la</em> métrique de référence.</p>
    <p><em>Ex. coût 100, vente 150 → marge = 50÷150 = 33%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">📈 Marque (markup)</div>
    <p>Profit ÷ <strong>Coût d'achat</strong>. Plus élevée que la marge. Souvent confondue avec elle.</p>
    <p><em>Ex. coût 100, vente 150 → marque = 50÷100 = 50%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">💵 Profit (résultat)</div>
    <p>Marge brute × volume - charges fixes. C'est ce qui reste vraiment dans la caisse à la fin.</p>
  </div>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Le piège des 50% qui n'en sont pas</div>
  <p>"Mon fournisseur me vend à 100, je vends à 150, je fais 50% de marge !" Faux. Il fait 50% de <em>marque</em>, mais seulement 33% de <em>marge</em>. Cette erreur est la cause n°1 des erreurs de pricing en Algérie.</p>
</div>

<h2>La formule complète du coût</h2>

<p>Le coût d'un produit n'est pas son prix d'achat. C'est tout ce qui le rend disponible au client final :</p>

<ol class="numbered-list">
  <li><strong>Prix d'achat fournisseur</strong> (HT)</li>
  <li><strong>Frais de douane</strong> (si import)</li>
  <li><strong>Transport amont</strong> (port → entrepôt)</li>
  <li><strong>Frais bancaires</strong> (lettre de crédit, change)</li>
  <li><strong>Stockage</strong> (loyer entrepôt ÷ rotation)</li>
  <li><strong>Manutention</strong> (salaires magasiniers ÷ unités)</li>
  <li><strong>Casse, vol, péremption</strong> (≈ 1-3% selon secteur)</li>
  <li><strong>Distribution</strong> (carburant, salaire livreur, usure véhicule ÷ tournées)</li>
  <li><strong>Coûts administratifs</strong> (factures, comptabilité, support ÷ unités)</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 La règle des 1,4×</div>
  <p>Pour la plupart des distributeurs algériens, le <strong>coût total</strong> est environ <strong>1,4 fois</strong> le coût d'achat fournisseur. Si vous achetez à 100, le coût pour <em>livrer</em> chez le client tourne autour de 140 DA. Tout calcul de marge basé sur le seul prix d'achat est une illusion.</p>
</div>

<h2>Benchmarks par secteur en Algérie</h2>

<p>Voici les marges typiques observées dans le marché algérien (sources : enquêtes terrain, retours utilisateurs TrackSera) :</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
<thead>
<tr style="background: #f3f4f6;">
<th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Secteur</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Marge brute typique</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Marge nette*</th>
</tr>
</thead>
<tbody>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Alimentation générale</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-5%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Boissons (eaux, sodas)</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">12-22%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">4-8%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Lait, produits laitiers</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Hygiène, cosmétique</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">18-30%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Électronique grand public</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">1-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Pharmacie / parapharmacie</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">15-25%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-9%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Pièces auto</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">20-40%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td></tr>
<tr><td style="padding: 12px;">Matériaux construction</td><td style="text-align: center; padding: 12px;">10-18%</td><td style="text-align: center; padding: 12px;">3-7%</td></tr>
</tbody>
</table>

<p><em>* Marge nette = après déduction de toutes les charges (loyer, salaires, taxes, etc.)</em></p>

<h2>Les 5 leviers pour augmenter votre marge</h2>

<ol class="numbered-list">
  <li>
    <strong>Renégocier les prix d'achat</strong><br/>
    Une réduction de 2% chez le fournisseur = 2 points de marge gagnés directement. Sur 1 million de CA, c'est 20 000 DA/mois.
  </li>
  <li>
    <strong>Optimiser les tournées de livraison</strong><br/>
    Le carburant est la 2ᵉ charge variable après l'achat. Voir <a href="/blog/optimiser-tournee-livraison-6-regles">6 règles pour optimiser une tournée</a>.
  </li>
  <li>
    <strong>Éliminer les clients non rentables</strong><br/>
    20% des clients génèrent 80% du profit. Les autres coûtent souvent plus qu'ils ne rapportent. Identifiez-les et arrêtez les livraisons à perte.
  </li>
  <li>
    <strong>Tuer les produits morts</strong><br/>
    Un produit qui se vend 1 fois par mois immobilise du stock, occupe l'espace, et a un risque de péremption élevé. Sortez-le du catalogue.
  </li>
  <li>
    <strong>Calculer la marge par client / par produit</strong><br/>
    Pas seulement la marge globale. Sans ce détail, vous pilotez à l'aveugle.
  </li>
</ol>

<div class="success-box">
  <div class="box-title">✓ Le résultat possible</div>
  <p>Un de nos clients distributeur de boissons à Sétif est passé de 11% à 16% de marge brute en 6 mois — uniquement en : (1) renégociant 2 fournisseurs, (2) éliminant 18 clients non rentables, (3) supprimant 47 produits qui ne tournaient pas. Pas de baisse de CA. Juste plus d'argent qui reste.</p>
</div>

<div class="divider"></div>

<h2>Comment TrackSera vous donne la marge en temps réel</h2>

<p>TrackSera calcule automatiquement :</p>

<ul class="check-list">
  <li>Marge brute par produit (avec coût moyen pondéré)</li>
  <li>Marge brute par client (sur 30, 90, 365 jours)</li>
  <li>Marge brute par livreur, par véhicule, par tournée</li>
  <li>Marge brute par wilaya / par secteur d'activité</li>
  <li>Détection automatique des ventes à perte (alerte)</li>
  <li>Top/flop produits par marge en valeur absolue</li>
  <li>Comparaison période à période (ce mois vs mois dernier)</li>
</ul>

<p><a href="/register">Démarrer un essai gratuit de 14 jours</a> et découvrir vos vraies marges.</p>

<p><em>Lire aussi : <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 chiffres à surveiller chaque matin</a>, <a href="/blog/tva-9-19-algerie-distribution">TVA 9% ou 19% en Algérie</a>, et <a href="/blog/excel-vs-logiciel-distribution">Excel vs logiciel : combien perdez-vous</a>.</em></p>
`,
};

export default data;
