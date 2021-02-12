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

async function loopSome (ours: Record<string, string[]>, site: string, matcher: () => Promise<string[] | null>): Promise<void> {
  const all = Object.values(ours).reduce((all: string[], addrs: string[]): string[] => {
    all.push(...addrs);

    return all;
  }, []);
  const found: string[] = [];

  for (let i = 0; i < 20; i++) {
    try {
      const addresses = await matcher();

      if (addresses) {
        addresses.forEach((address): void => {
          if (address && !found.includes(address)) {
            found.push(address);
          }
        });
      }
    } catch (error) {
      // ignore
    }

    await new Promise<boolean>((resolve) => setTimeout(() => resolve(true), Math.floor((Math.random() * 750) + 1000)));
  }

  console.log(site, JSON.stringify(found));

  const missing = found.filter((a) => !all.includes(a));

  assertAndLog(missing.length === 0, `Missing entries found for ${site}: ${JSON.stringify(missing)}`);
}

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
async function checkGetWallet (ours: Record<string, string[]>, site: string): Promise<void> {
  await loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(`https://${site}/get_wallet.php`)).json() as Record<string, string>;

    return (result && result.wallet)
      ? [result.wallet.replace('\r', '').trim()]
      : null;
  });
}

// shared between polkadotlive.network & polkadots.network
async function checkTrnsctin (ours: Record<string, string[]>, site: string, url: string): Promise<void> {
  await loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(url)).text();
    const match = result.match(/<p id="trnsctin">(.*?)<\/p>/g);

    return match && match.length
      ? match.map((v) => v.replace(/<\/?p( id="trnsctin")?>/g, '').trim())
      : null;
  });
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

  it('has the addresses for polkadotlive.network', async (): Promise<void> => {
    await checkTrnsctin(ours, 'polkadotlive.network', 'https://polkadotlive.network/block-assets/index.html');
  });

  it('has the addresses for polkadots.network', async (): Promise<void> => {
    await checkTrnsctin(ours, 'polkadots.network', 'https://polkadots.network/block.html');
  });

  it('has the addresses for dot4.org', async (): Promise<void> => {
    await loopSome(ours, 'dot4.org', async (): Promise<string[] | null> => {
      const result = await (await fetch('https://dot4.org/promo/')).text();
      const match = result.match(/<p class="payment-title">(.*?)<\/p>/g);

      return match && match.length
        ? match.map((v) => v.replace(/<\/?p( class="payment-title")?>/g, '').replace(/">/g, '').trim())
        : null;
    });
  });
});
