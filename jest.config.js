module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '.(css|less|scss)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: ['node_modules/(?!(three)/)'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.tsx'],
  coveragePathIgnorePatterns: ['src/__tests__/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.*__fixtures__/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
};
