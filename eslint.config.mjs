// Minimal ESLint flat config.
// We skip eslint-config-next's FlatCompat wrapper because it has a known
// circular-reference bug that crashes ESLint's config validation.
// TypeScript type checking is our primary correctness gate (runs in build).

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/sw.js',
      'public/**/*.js',
      'src/generated/**',
    ],
  },
];
