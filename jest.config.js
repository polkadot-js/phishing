// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
  },
  modulePathIgnorePatterns: [
    '<rootDir>/build'
  ],
  resolver: './jest.resolver.js'
});
