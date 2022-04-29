// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest.cjs');

module.exports = {
  ...config,
  moduleNameMapper: {},
  setupFilesAfterEnv: ['<rootDir>/jest/setupEnv.cjs'],
  testEnvironment: 'jsdom',
  testTimeout: 2 * 60 * 1000
};
