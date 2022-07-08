// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import test from 'ava';

import { checkIfDenied } from '.';

test('returns false when host is not listed', async (t): Promise<void> => {
  t.false(
    await checkIfDenied('polkadot.network')
  );
});

test('returns false when host is not listed (with protocol)', async (t): Promise<void> => {
  t.false(
    await checkIfDenied('https://polkadot.network')
  );
});

test('returns true when host in list', async (t): Promise<void> => {
  t.true(
    await checkIfDenied('polkawallets.site')
  );
});

test('returns true when host in list (www-prefix)', async (t): Promise<void> => {
  t.true(
    await checkIfDenied('www.polkadotfund.com')
  );
});

test('returns true when host in list (protocol)', async (t): Promise<void> => {
  t.true(
    await checkIfDenied('https://polkawallets.site')
  );
});

test('returns true when host in list (protocol + path)', async (t): Promise<void> => {
  t.true(
    await checkIfDenied('https://polkawallets.site/something/index.html')
  );
});

test('returns true in list (protocol + path + #)', async (t): Promise<void> => {
  t.true(
    await checkIfDenied('https://robonomics-network-xrt.cyberfi-tech-rewards-programs-claims-erc20-token.com/myetherwallet/access-my-wallet/#/input-privatekey-mnemonic-phrase-claim-bonus')
  );
});
