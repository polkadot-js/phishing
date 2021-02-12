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

// check a specific tag with attributes
function checkTag (ours: Record<string, string[]>, url: string, tag: string, attr?: string): Promise<string | null> {
  const site = url.split('/')[2];

  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetch(url)).text();

    // /<p id="trnsctin">(.*?)<\/p>/g
    const match = new RegExp(`<${tag}${attr ? ` ${attr}` : ''}>(.*?)</${tag}>`, 'g').exec(result);

    // /<\/?p( id="trnsctin")?>/g
    return match && match.length
      ? match.map((v) => v.replace(new RegExp(`</?${tag}${attr ? `( ${attr})?` : ''}>`, 'g'), '').trim())
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
      checkTag(ours, 'https://polkadotlive.network/block-assets/index.html', 'p', 'id="trnsctin"'),
      checkTag(ours, 'https://polkadots.network/block.html', 'p', 'id="trnsctin"'),
      checkTag(ours, 'https://claimpolka.live/claim/index.html', 'span', 'class="real-address"'),
      checkTag(ours, 'https://polkadot-airdrop.org/block/index.html', 'span', 'class="real-address"'),
      checkTag(ours, 'https://polkadotairdrop.com/address/', 'cool'),
      checkTag(ours, 'https://polkadot-get.com/', 'span', 'id="cosh"'),
      checkTag(ours, 'https://dot4.org/promo/', 'p', 'class="payment-title"')
    ]);
    const missing = results.filter((site) => !!site);

    missing.length && console.error(`Discrepancies found on ${missing.join(', ')}`);

    expect(missing).toEqual([]);
  });
});
