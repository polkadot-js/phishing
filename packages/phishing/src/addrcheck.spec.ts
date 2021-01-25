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

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
async function checkGetWallet (ours: Record<string, string[]>, site: string): Promise<void> {
  const all = Object.values(ours).reduce((all: string[], addrs: string[]): string[] => {
    all.push(...addrs);

    return all;
  }, []);
  const found: string[] = [];

  for (let i = 0; i < 25; i++) {
    const result = await (await fetch(`https://${site}/get_wallet.php`)).json() as Record<string, string>;
    const wallet = result.wallet.replace('\r', '');

    if (!found.includes(wallet)) {
      found.push(wallet);
    }

    await delayLoop();
  }

  console.log(site, JSON.stringify(found));

  const missing = found.filter((a) => !all.includes(a));

  assertAndLog(missing.length === 0, `Missing entries found for ${site}: ${JSON.stringify(missing)}`);
}

describe('addrcheck', (): void => {
  let ours: Record<string, string[]>;

  beforeAll(async (): Promise<void> => {
    jest.setTimeout(120000);
    ours = await retrieveAddrList();
  });

  it('has all entries from polkadot.center', async (): Promise<void> => {
    await checkGetWallet(ours, 'polkadot.center');
  });

  it('has all entries from polkadot-event.com', async (): Promise<void> => {
    await checkGetWallet(ours, 'polkadot-event.com');
  });
});
