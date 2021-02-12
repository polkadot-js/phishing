// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import { fetch } from '@polkadot/x-fetch';

import { retrieveAddrList } from '.';

function logMissing (site: string, missing: string[]): string | null {
  if (missing.length) {
    process.env.CI_LOG && fs.appendFileSync('./.github/addrcheck.md', `

Missing entries found for ${site}: ${JSON.stringify(missing)}
`);

    return site;
  }

  return null;
}

async function loopSome (ours: Record<string, string[]>, site: string, matcher: () => Promise<string[] | null>): Promise<string | null> {
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

  return logMissing(site, found.filter((a) => !all.includes(a)));
}

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
function checkGetWallet (ours: Record<string, string[]>, site: string): Promise<string | null> {
  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(`https://${site}/get_wallet.php`)).json() as Record<string, string>;

    return (result && result.wallet)
      ? [result.wallet.replace('\r', '').trim()]
      : null;
  });
}

// shared between claimpolka.live & polkadots.network
function checkTrnsctin (ours: Record<string, string[]>, site: string, url: string): Promise<string | null> {
  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(url)).text();
    const match = result.match(/<p id="trnsctin">(.*?)<\/p>/g);

    return match && match.length
      ? match.map((v) => v.replace(/<\/?p( id="trnsctin")?>/g, '').trim())
      : null;
  });
}

// shared between polkadotlive.network & polkadot-airdrop.org
async function checkRealAddr (ours: Record<string, string[]>, site: string, url: string): Promise<string | null> {
  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(url)).text();
    const match = result.match(/<span class="real-address">(.*?)<\/span>/g);

    return match && match.length
      ? match.map((v) => v.replace(/<\/?span( class="real-address")?>/g, '').trim())
      : null;
  });
}

describe('addrcheck', (): void => {
  let ours: Record<string, string[]>;

  beforeAll(async (): Promise<void> => {
    jest.setTimeout(120000);
    ours = await retrieveAddrList();
  });

  it('has all known addresses', async (): Promise<void> => {
    const results = await Promise.all([
      checkGetWallet(ours, 'polkadot.center'),
      checkGetWallet(ours, 'polkadot-event.com'),
      checkTrnsctin(ours, 'polkadotlive.network', 'https://polkadotlive.network/block-assets/index.html'),
      checkTrnsctin(ours, 'polkadots.network', 'https://polkadots.network/block.html'),
      checkRealAddr(ours, 'claimpolka.live', 'https://claimpolka.live/claim/index.html'),
      checkRealAddr(ours, 'polkadot-airdrop.org', 'https://polkadot-airdrop.org/block/index.html'),
      loopSome(ours, 'polkadotairdrop.com', async (): Promise<string[] | null> => {
        const result = await (await fetch('https://polkadotairdrop.com/address/')).text();
        const match = result.match(/<cool>(.*?)<\/cool>/g);

        return match && match.length
          ? match.map((v) => v.replace(/<\/?cool>/g, '').trim())
          : null;
      }),
      loopSome(ours, 'polkadot-get.com', async (): Promise<string[] | null> => {
        const result = await (await fetch('https://polkadot-get.com/')).text();
        const match = result.match(/<span id="cosh">(.*?)<\/span>/g);

        return match && match.length
          ? match.map((v) => v.replace(/<\/?span( id="cosh")?>/g, '').trim())
          : null;
      }),
      loopSome(ours, 'dot4.org', async (): Promise<string[] | null> => {
        const result = await (await fetch('https://dot4.org/promo/')).text();
        const match = result.match(/<p class="payment-title">(.*?)<\/p>/g);

        return match && match.length
          ? match.map((v) => v.replace(/<\/?p( class="payment-title")?>/g, '').trim())
          : null;
      })
    ]);

    const missing = results.filter((site) => !!site);

    missing.length && console.error(`Discrepancies found on ${missing.join(', ')}`);

    expect(missing).toHaveLength(0);
  });
});
