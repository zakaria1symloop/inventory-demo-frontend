import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'livreur-vol-distribution-7-signaux',
  category: 'guides',
  date: '2026-04-07',
  readTime: 9,
  author: 'TrackSera',
  emoji: '🚨',
  gradient: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
};

export default post;
