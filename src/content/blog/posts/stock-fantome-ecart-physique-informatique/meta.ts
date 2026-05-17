import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'stock-fantome-ecart-physique-informatique',
  category: 'guides',
  date: '2026-04-02',
  readTime: 8,
  author: 'TrackSera',
  emoji: '👻',
  gradient: 'linear-gradient(135deg, #475569 0%, #27272a 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
};

export default post;
