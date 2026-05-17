import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Le tableau de bord du distributeur — 5 chiffres à regarder chaque matin',
  excerpt: 'Piloter une entreprise de distribution sans tableau de bord, c\'est conduire un camion les yeux fermés. Voici les 5 chiffres qui révèlent la santé de votre activité en 60 secondes.',
  tags: ['Dashboard', 'KPI', 'Pilotage', 'Indicateurs', 'Analyse'],
  content: `
<p class="lead">Chaque matin, vous avez <strong>60 secondes</strong> entre votre premier café et le premier appel du magasinier. Ces 60 secondes devraient suffire à savoir si hier était une bonne ou une mauvaise journée, et où regarder en priorité aujourd'hui. Voici <span class="highlight-blue">les 5 chiffres</span> qui donnent cette vision — et pourquoi les autres ne comptent presque pas.</p>

<h2>1. Chiffre d'affaires de la veille vs moyenne 7 jours</h2>

<p>Le chiffre brut d'hier ne veut rien dire seul. Ce qui compte, c'est : <strong>est-ce qu'hier était au-dessus ou en-dessous de la tendance ?</strong></p>

<div class="info-box">
  <div class="box-title">💡 La lecture qui compte</div>
  <p>Affichez hier en DA ET en % par rapport à la moyenne des 7 derniers jours. Un jour à -23% n'est pas grave en soi (vendredi férié). Un jour à -23% qui suit trois autres jours à -15% est un <strong>signal d'alerte</strong>.</p>
</div>

<p>Concrètement, sur votre dashboard matinal :</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">1 247 500 DA</div>
    <div class="stat-label">CA d'hier</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">+12%</div>
    <div class="stat-label">vs moyenne 7 jours</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#3b82f6">83</div>
    <div class="stat-label">Transactions</div>
  </div>
</div>

<p>Trois informations, deux secondes de lecture. Vous savez déjà si vous pouvez respirer ou s'il faut creuser.</p>

<h2>2. Cash encaissé vs cash attendu</h2>

<p>Le CA facturé ne paie pas vos fournisseurs. Ce qui paie vos fournisseurs, c'est <strong>le cash qui est rentré</strong>. Et dans 90% des distributions algériennes, il existe un écart quotidien entre les deux :</p>

<ul class="check-list">
  <li>Ventes à crédit (paiement à 30 jours)</li>
  <li>Clients qui paient en partie</li>
  <li>Chèques non encore déposés</li>
  <li>Écarts de caisse non expliqués</li>
</ul>

<div class="warning-box">
  <div class="box-title">⚠️ Le ratio qui tue</div>
  <p>Si votre ratio <strong>Cash encaissé ÷ Cash attendu</strong> tombe sous 85% pendant 3 jours consécutifs, vous avez un problème de recouvrement. Pas demain. Maintenant.</p>
</div>

<h2>3. Stock critique : combien de références en rupture imminente</h2>

<p>C'est le chiffre que les patrons oublient le plus, et c'est celui qui fait le plus mal. Vous vendez bien un produit. Le stock baisse. Personne ne commande le réapprovisionnement. Vous découvrez la rupture <strong>le jour où un gros client passe commande</strong> et vous dit "annulez, je vais chez votre concurrent."</p>

<p>Votre tableau de bord doit vous dire, en un chiffre :</p>

<div class="purple-box">
  <div class="box-title">📦 Exemple</div>
  <p><strong>17 références</strong> atteignent leur seuil critique dans les 7 prochains jours au rythme de consommation actuel. Cliquez pour voir la liste, comparez aux délais fournisseurs, déclenchez une commande si nécessaire.</p>
</div>

<p>C'est tout. Pas besoin de rapport Excel de 40 colonnes. Un chiffre, une liste, une action.</p>

<h2>4. Livraisons en retard ou échouées</h2>

<p>Une livraison qui n'arrive pas à bon port est un client perdu potentiel. Une livraison en retard sans prévenir le client, c'est un client perdu réel. Votre matin doit commencer par cette question : <strong>"Y a-t-il eu hier des tournées qui n'ont pas bouclé ?"</strong></p>

<p>Le dashboard doit agréger :</p>

<ul class="check-list">
  <li>Nombre de livraisons <strong>réussies</strong> (signature + client content)</li>
  <li>Nombre de livraisons <strong>échouées</strong> (client absent, refus, erreur d'adresse)</li>
  <li>Nombre de livraisons <strong>retournées au dépôt</strong> (à re-livrer aujourd'hui)</li>
  <li>Le livreur concerné par chaque échec — pour comprendre si c'est un schéma</li>
</ul>

<h2>5. Marge du jour (pas seulement le CA)</h2>

<p>Vendre à perte, on l'a tous fait. Le drame, c'est vendre à perte <strong>sans le savoir</strong>. Un livreur zélé qui applique la "remise fidèle ami de 15%" sur des produits déjà à marge 8%, c'est une journée de ventes qui vous coûte de l'argent.</p>

<p>Votre dashboard doit afficher :</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#3b82f6">1 247 500</div>
    <div class="stat-label">CA (DA)</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#f59e0b">983 200</div>
    <div class="stat-label">Coût marchandises</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">21,2%</div>
    <div class="stat-label">Marge brute</div>
  </div>
</div>

<p>Si la marge brute du jour est <strong>5 points en-dessous</strong> de votre moyenne, quelque chose cloche. Remise non autorisée, erreur de tarification, produit perdu compté en vente... Les 5 chiffres vous disent <strong>où regarder</strong>.</p>

<h2>Ce que vous ne devez PAS mettre dans votre dashboard matinal</h2>

<p>La tentation est de tout afficher. C'est la meilleure façon de ne rien voir. Voici ce qui ne mérite pas la place du premier écran :</p>

<ul class="check-list">
  <li>Le CA annuel cumulé (à voir une fois par mois, pas chaque matin)</li>
  <li>Les tops produits (à voir hebdomadairement pour planifier les achats)</li>
  <li>La liste complète des clients (inutile au réveil)</li>
  <li>Les graphiques 3D décoratifs (ils ne servent à rien)</li>
  <li>Les "KPIs" que vous ne comprenez pas ou que vous n'utilisez jamais</li>
</ul>

<div class="info-box">
  <div class="box-title">💡 La règle d'or</div>
  <p>Si vous ne prenez <strong>aucune décision</strong> à partir d'un chiffre, il ne devrait pas être sur votre dashboard matinal. Trouvez-lui un écran "rapport hebdo" ou "analyse mensuelle".</p>
</div>

<h2>Comment TrackSera organise cela</h2>

<p>Notre tableau de bord d'accueil est volontairement minimaliste : <strong>5 blocs, un seul écran, pas de scroll</strong>. Tout le reste est dans les rapports détaillés, accessibles en un clic quand vous en avez besoin — pas avant.</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">📈</div>
    <h4>CA jour vs 7j</h4>
    <p>Avec variation % et nombre de transactions</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">💰</div>
    <h4>Cash du jour</h4>
    <p>Encaissé vs attendu, par mode de paiement</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">📦</div>
    <h4>Stock critique</h4>
    <p>Références en alerte selon consommation réelle</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">🚚</div>
    <h4>Livraisons</h4>
    <p>Réussies / échouées / en cours par livreur</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#e0f2fe;color:#075985">📊</div>
    <h4>Marge du jour</h4>
    <p>Marge brute avec alerte si écart anormal</p>
  </div>
</div>

<div class="success-box">
  <div class="box-title">✅ 60 secondes, c'est assez</div>
  <p>Si votre tableau de bord actuel vous prend plus d'une minute à lire, il est mal conçu. Venez voir à quoi ressemble un vrai dashboard de distribution. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Essai gratuit →</a></p>
</div>

<hr class="divider"/>

<p><em>À lire aussi : <a href="/blog/livreur-vol-distribution-7-signaux">Les 7 signaux d'un livreur malhonnête</a> et <a href="/blog/suivi-gps-livreurs-algerie-2026">Le suivi GPS en Algérie en 2026</a>.</em></p>
`,
};

export default data;
