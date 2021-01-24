// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import { fetch } from '@polkadot/x-fetch';

import { retrieveAddrList } from '.';

function assertAndLog (check: boolean, error: string): void {
  if (!check) {
    process.env.CI_LOG && fs.appendFileSync('./.github/addrcheck.md', `

${error}
`);

    throw new Error(error);
  }
}

function delayLoop (): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(() => resolve(), 1500);
  });
}

describe('addrcheck', (): void => {
  let ours: Record<string, string[]>;

  beforeAll(async (): Promise<void> => {
    jest.setTimeout(120000);
    ours = await retrieveAddrList();
  });

  it('has all entries from polkadot.center', async (): Promise<void> => {
    const found: string[] = [];

    for (let i = 0; i < 25; i++) {
      const result = await (await fetch('https://polkadot.center/get_wallet.php')).json() as Record<string, string>;
      const wallet = result.wallet.replace('\r', '');

      if (!found.includes(wallet)) {
        found.push(wallet);
      }

      await delayLoop();
    }

    console.log('polkadot.center', JSON.stringify(found));

    const missing = found.filter((a) => !ours['polkadot.center'].includes(a));

    assertAndLog(missing.length === 0, `Missing entries found for polkadot.center: ${JSON.stringify(missing)}`);
  });
});
