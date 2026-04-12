import { defineConfig } from '@playwright/test';

const mockedBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
  },
  webServer: {
    command: 'npm run start:renderer',
    url: mockedBaseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },

  projects: [
    {
      name: 'Mocked-Tests',
      testMatch: /.*mocked\.spec\.ts/,
      use: { 
        baseURL: mockedBaseURL,
      },
    },
    {
      name: 'Fullstack-Tests',
      testMatch: /.*fullstack\.spec\.ts/,
      use: { 
      },
      fullyParallel: false,
      workers: 1,
    }
  ],
});

//TUTTO => npx playwright test
//VELOCI => npx playwright test --project=Mocked-Tests
//COMPLETI => npx playwright test --project=Fullstack-Tests