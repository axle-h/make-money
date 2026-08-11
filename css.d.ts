// Next.js declares '*.module.css' in next/types/global.d.ts but not plain
// global stylesheets. TypeScript 6 rejects side-effect imports of modules it
// has no declaration for (TS2882), so declare them here.
declare module '*.css'
