// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import test from 'ava';

import { checkAddress } from '.';

test('returns null if the address is not found', async (t): Promise<void> => {
  t.true(
    await checkAddress('5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY') === null
  );
});

test('returns the site when the address is found', async (t): Promise<void> => {
  t.true(
    await checkAddress('14Vxs7UB9FqfQ53wwTJUBAJThs5N7b3bg89HscRU6eBqrFhQ') === 'polkadot.center'
  );
});

test('returns the site even if the ss58 is different', async (t): Promise<void> => {
  t.true(
    await checkAddress('5FkmzcdNekhdSA7j4teSSyHGUnKT8bzNBFvVVeZSGmbSpYHH') === 'polkadots.network'
  );
});
