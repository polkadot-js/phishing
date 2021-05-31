// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest.cjs');

module.exports = {
  ...config,
  moduleNameMapper: {},
  modulePathIgnorePatterns: [
    '<rootDir>/build',
    '<rootDir>/packages/phishing/build'
  ],
  testEnvironment: 'jsdom',
  testTimeout: 2 * 60 * 1000,
  transformIgnorePatterns: ['/node_modules/(?!@polkadot|@babel/runtime/helpers/esm/)']
};
