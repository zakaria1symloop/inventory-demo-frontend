// This file used to host a ~5,800-line array of 16 bilingual blog posts.
// It has been refactored to one folder per post under
// `src/content/blog/posts/<slug>/`. Adding a post = new folder + 1 line in
// `src/content/blog/_index.ts`.
//
// This module re-exports the new structure so existing imports
// (`@/lib/blog-data`) keep working untouched.

export {
  blogPosts,
  getBlogPost,
  getPostsForCountry,
  categoryLabels,
} from '@/content/blog/_index';

export type {
  BlogPost,
  BlogCategory,
  BlogFAQ,
  BlogHowToStep,
  CountryCode,
} from '@/content/blog/_index';
