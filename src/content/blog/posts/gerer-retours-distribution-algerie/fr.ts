import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Gérer les retours en distribution : clients et fournisseurs (guide pratique)',
  excerpt:
    "Un retour mal géré coûte 3-5% du CA annuel à un distributeur. Voici la méthode pour tracer, comptabiliser et récupérer chaque DA.",
  tags: ['Retours', 'Stocks', 'Comptabilité', 'Fournisseurs', 'Guide'],
  content: `
<p class="lead">Le retour est un sujet que tout le monde déteste : le client se plaint, le livreur perd son temps, le magasinier rouspète, le comptable s'arrache les cheveux. <span class="highlight-blue">Pourtant, mal géré, il coûte 3 à 5% du chiffre d'affaires annuel</span> — soit l'équivalent de toute votre marge nette dans certains secteurs. Voici comment le maîtriser.</p>

<h2>Les 4 types de retours en distribution</h2>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">↪️ Retour client (avoir)</div>
    <p>Le client vous renvoie un produit. Causes : qualité, erreur de livraison, péremption, refus, casse au transport.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">↩️ Retour fournisseur</div>
    <p>Vous renvoyez un produit au fournisseur. Causes : défaut, surplus, péremption, rupture de contrat.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">🚫 Refus à la livraison</div>
    <p>Le client refuse la marchandise sur le pas de la porte. Le livreur la ramène. Cas particulièrement fréquent en Algérie.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">💔 Casse / péremption</div>
    <p>Pas un retour à proprement parler, mais une sortie d'inventaire à enregistrer. Coûte directement votre marge.</p>
  </div>
</div>

<h2>La méthode en 6 étapes pour tracer chaque retour</h2>

<h3>1. Enregistrer immédiatement (pas plus tard)</h3>

<p>Le retour qui n'est pas saisi le jour même a 60% de chances d'être perdu — soit oublié, soit le client paie sa facture <em>complète</em> sans réclamer, et vous gardez de l'argent qui ne devrait pas être à vous.</p>

<div class="warning-box">
  <div class="box-title">⚠️ Le retour fantôme</div>
  <p>Le livreur ramène la marchandise. Personne ne fait l'avoir. Le client paie ce qu'il avait commandé. Six mois plus tard, lors d'un audit, on retrouve le stock "fantôme" et personne ne sait d'où il vient. Vu 100 fois.</p>
</div>

<h3>2. Identifier la cause précise</h3>

<p>Pas "retour client" simplement. <em>Pourquoi</em> ? :</p>

<ul class="check-list">
  <li>Erreur de référence à la commande</li>
  <li>Erreur de quantité</li>
  <li>Produit cassé à la livraison</li>
  <li>Produit défectueux d'usine</li>
  <li>Produit périmé</li>
  <li>Refus du client (commande annulée)</li>
  <li>Erreur de prix sur la facture</li>
</ul>

<p>Sans cette analyse, vous ne pouvez pas <em>réduire</em> les retours. Et plus vos retours sont élevés, plus votre marge est rongée.</p>

<h3>3. Décider du sort du produit</h3>

<p>Trois cas, trois traitements :</p>

<ol class="numbered-list">
  <li><strong>Revendable</strong> : remise en stock principal, prêt à être livré à un autre client</li>
  <li><strong>Réparable / dégradé</strong> : stock "soldes" ou "B-grade", vendu à prix réduit</li>
  <li><strong>Casse / périmé</strong> : sortie d'inventaire, perte définitive comptabilisée</li>
</ol>

<h3>4. Émettre l'avoir conformément</h3>

<p>L'avoir doit contenir :</p>

<ul class="check-list">
  <li>Numéro séquentiel (séparé de la numérotation factures)</li>
  <li>Référence à la facture d'origine</li>
  <li>Date d'émission</li>
  <li>Détail des produits, quantités, prix HT, TVA</li>
  <li>Motif du retour</li>
  <li>Mentions légales (NIF, NIS, RC, AI)</li>
</ul>

<h3>5. Mettre à jour le compte client</h3>

<p>L'avoir réduit le solde du client :</p>

<ul>
  <li>Si le client a payé la facture initiale → l'avoir devient un crédit utilisable sur sa prochaine commande, ou un remboursement</li>
  <li>Si le client n'a pas encore payé → l'avoir réduit la dette à régler</li>
</ul>

<h3>6. Régulariser la TVA dans la déclaration mensuelle</h3>

<p>L'avoir réduit la TVA collectée du mois. Si vous oubliez cette régularisation, vous payez de la TVA sur de l'argent que vous n'avez jamais reçu.</p>

<h2>Le cas spécial : retours fournisseurs</h2>

<p>Quand vous renvoyez un produit à votre fournisseur, le processus est inverse :</p>

<ol class="numbered-list">
  <li><strong>Constat de défaut</strong> à la réception (photos, procès-verbal)</li>
  <li><strong>Notification écrite</strong> au fournisseur dans les délais (généralement 48h pour vices apparents, 6 mois pour vices cachés)</li>
  <li><strong>Bon de retour</strong> émis par vous</li>
  <li><strong>Avoir fournisseur</strong> reçu en retour (à exiger absolument)</li>
  <li><strong>Mise à jour du stock</strong> : sortie de la marchandise retournée</li>
  <li><strong>Compensation</strong> : sur prochaine facture ou remboursement direct</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 Tactique : bloquer le paiement</div>
  <p>Tant que l'avoir fournisseur n'est pas reçu, ne payez pas. Beaucoup de fournisseurs "oublient" d'émettre l'avoir si vous avez déjà réglé. Bloquez le paiement = vous gardez le pouvoir de négociation.</p>
</div>

<h2>Les 4 erreurs qui coûtent cher</h2>

<div class="warning-box">
  <div class="box-title">⚠️ Erreur n°1 : Pas de numérotation des avoirs</div>
  <p>L'administration fiscale exige une séquence continue. "AV-001, AV-002..." doit être strictement séquentiel comme les factures.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Erreur n°2 : Avoir sans référence à la facture d'origine</div>
  <p>Sans le lien, l'avoir est invalide pour le fisc. Et impossible à tracer en interne.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Erreur n°3 : Ne pas distinguer "casse" de "retour"</div>
  <p>Un produit cassé en entrepôt n'est pas un retour client. C'est une perte directe. Comptabilité différente.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Erreur n°4 : Oublier la TVA dans la régularisation G50</div>
  <p>Si vous n'enlevez pas la TVA des avoirs dans votre déclaration mensuelle, vous payez de la TVA "imaginaire". 100 000 DA d'avoirs = 19 000 DA de TVA payée pour rien.</p>
</div>

<div class="divider"></div>

<h2>Comment TrackSera gère les retours</h2>

<ul class="check-list">
  <li>Module de retour client lié directement à la facture d'origine (un clic sur la facture → "créer un retour")</li>
  <li>Choix automatique du destinataire du stock retourné (principal, réparation, casse)</li>
  <li>Génération automatique de l'avoir avec numéro séquentiel séparé</li>
  <li>Mise à jour automatique du compte client et de la TVA mensuelle</li>
  <li>Module retour fournisseur avec workflow d'approbation</li>
  <li>Tableau de bord des retours par cause / livreur / produit / client (pour identifier les problèmes systémiques)</li>
  <li>Alerte si un client dépasse un taux de retour anormal</li>
</ul>

<p><a href="/register">Démarrer un essai gratuit de 14 jours</a> et arrêter de perdre de l'argent sur les retours.</p>

<p><em>Lire aussi : <a href="/blog/stock-fantome-ecart-physique-informatique">Stock fantôme : pourquoi vos chiffres ne matchent pas</a>, <a href="/blog/logiciel-facturation-algerie-2026">Logiciel de facturation Algérie 2026</a>, et <a href="/blog/calculer-marge-distributeur-algerie">Comment calculer la marge</a>.</em></p>
`,
};

export default data;
