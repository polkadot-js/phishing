// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest.cjs');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {},
  modulePathIgnorePatterns: [
    '<rootDir>/build'
  ],
  resolver: '@polkadot/dev/config/jest-resolver.cjs'
});
