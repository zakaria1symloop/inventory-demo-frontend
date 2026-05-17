// Aggregates all per-post `meta.ts` modules into the discoverable
// `blogPosts` array. Adding a new post = create a new folder under
// `posts/<slug>/` and add one import line below. No other file changes.
//
// Order in this array = order shown in the blog listing.

import type { BlogPost, BlogCategory } from './_types';
import { categoryLabels } from './_types';

import logicielGestionDistribution2026 from './posts/logiciel-gestion-distribution-algerie-2026/meta';
import livreurVolDistribution from './posts/livreur-vol-distribution-7-signaux/meta';
import cashvanVenteMobile from './posts/cashvan-vente-mobile-distribution-algerie/meta';
import suiviGpsLivreurs from './posts/suivi-gps-livreurs-algerie-2026/meta';
import tableauDeBordDistributeur from './posts/tableau-de-bord-distributeur-5-chiffres/meta';
import optimiserTourneeLivraison from './posts/optimiser-tournee-livraison-6-regles/meta';
import stockFantomeEcart from './posts/stock-fantome-ecart-physique-informatique/meta';
import logicielFacturation2026 from './posts/logiciel-facturation-algerie-2026/meta';
import passerExcelLogiciel from './posts/passer-excel-logiciel-distribution/meta';
import tva919Distribution from './posts/tva-9-19-algerie-distribution/meta';
import calculerMargeDistributeur from './posts/calculer-marge-distributeur-algerie/meta';
import gererRetoursDistribution from './posts/gerer-retours-distribution-algerie/meta';
import excelVsLogicielDistribution from './posts/excel-vs-logiciel-distribution/meta';
import distributionAlimentaire2026 from './posts/distribution-alimentaire-algerie-2026/meta';
import ouvrirSocieteDistribution from './posts/ouvrir-societe-distribution-algerie/meta';
import guideCompletDistribution from './posts/guide-complet-distribution-algerie-2026/meta';

export const blogPosts: BlogPost[] = [
  guideCompletDistribution,           // pillar — first for SEO
  logicielGestionDistribution2026,
  cashvanVenteMobile,
  suiviGpsLivreurs,
  tableauDeBordDistributeur,
  optimiserTourneeLivraison,
  stockFantomeEcart,
  logicielFacturation2026,
  passerExcelLogiciel,
  excelVsLogicielDistribution,
  tva919Distribution,
  calculerMargeDistributeur,
  gererRetoursDistribution,
  distributionAlimentaire2026,
  ouvrirSocieteDistribution,
  livreurVolDistribution,
];

export function getBlogPost(slug: string): BlogPost | undefined {
  // Match the default slug first; then per-locale slugs if defined.
  return blogPosts.find((p) => {
    if (p.slug === slug) return true;
    if (p.slugs) {
      return p.slugs.ar === slug || p.slugs.fr === slug || p.slugs.en === slug;
    }
    return false;
  });
}

/** Posts targeting a given country (or 'global'). */
export function getPostsForCountry(country: string): BlogPost[] {
  return blogPosts.filter((p) => {
    if (!p.countries || p.countries.length === 0) return true;
    return p.countries.includes(country as BlogPost['countries'] extends (infer C)[] | undefined ? C : never);
  });
}

export { categoryLabels };
export type { BlogPost, BlogCategory, BlogFAQ, BlogHowToStep, CountryCode } from './_types';
