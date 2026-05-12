// Full English dictionary, assembled from 4 translated chunks of fr.ts.
// Keys mirror ar.ts / fr.ts so all `t('section.key')` calls resolve here
// when the user's locale is 'en'. Missing keys fall back through
// fr → ar via the chain in context.tsx.

import en_part1 from './en_part1';
import en_part2 from './en_part2';
import en_part3 from './en_part3';
import en_part4 from './en_part4';

const en = {
  ...en_part1,
  ...en_part2,
  ...en_part3,
  ...en_part4,
} as const;

export default en;
