import next from 'eslint-config-next'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

const eslintConfig = [
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  ...next,
  // Must come last: disables the stylistic rules the other configs enable and
  // reports prettier differences as ESLint problems.
  prettierRecommended,
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
]

export default eslintConfig
