import { defineConfig, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './report/coverage',
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/{scratchpad,index,TapLogBoth,logObjectNicely,repo.interface}[.][jt]s'
      ]
    },
  },
})
