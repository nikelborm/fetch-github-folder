import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './gh-page/coverage',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'destination/**',
        '**/{scratchpad,index,TapLogBoth,logObjectNicely,repo.interface}[.][jt]s',
      ],
    },
  },
});
