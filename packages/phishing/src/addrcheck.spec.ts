// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import { fetch } from '@polkadot/x-fetch';

import { retrieveAddrList } from '.';

function logMissing (values: Record<string, string[]>): void {
  const sites = Object.keys(values);

  sites.length && process.env.CI_LOG && fs.appendFileSync('./.github/addrcheck.md', `

${sites.length} urls with missing entries found at ${new Date().toUTCString()}:

${JSON.stringify(values, null, 2)}
`);
}

async function fetchWithTimeout (url: string, timeout = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: controller.signal });

  clearTimeout(id);

  return response;
}

async function loopSome (ours: Record<string, string[]>, site: string, matcher: () => Promise<string[] | null>): Promise<[string, string[]]> {
  const found: string[] = [];

  for (let i = 0; i < 20; i++) {
    try {
      const addresses = await matcher();

      addresses && addresses.forEach((address): void => {
        if (address && !found.includes(address)) {
          found.push(address);
        }
      });
    } catch (error) {
      // ignore
    }

    await new Promise<boolean>((resolve) => setTimeout(() => resolve(true), Math.floor((Math.random() * 750) + 1000)));
  }

  return [site, found];
}

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
function checkGetWallet (ours: Record<string, string[]>, site: string): Promise<[string, string[]]> {
  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetchWithTimeout(`https://${site}/get_wallet.php`)).json() as Record<string, string>;

    return (result && result.wallet)
      ? [result.wallet.replace('\r', '').trim()]
      : null;
  });
}

// check a specific tag with attributes
function checkTag (ours: Record<string, string[]>, url: string, tag: string, attr?: string): Promise<[string, string[]]> {
  const site = url.split('/')[2];

  return loopSome(ours, site, async (): Promise<string[] | null> => {
    const result = await (await fetchWithTimeout(url)).text();

    // /<p id="trnsctin">(.*?)<\/p>/g
    const match = new RegExp(`<${tag}${attr ? ` ${attr}` : ''}>(.*?)</${tag}>`, 'g').exec(result);

    // /<\/?p( id="trnsctin")?>/g
    return match && match.length
      ? match.map((v) => v.replace(new RegExp(`</?${tag}${attr ? `( ${attr})?` : ''}>`, 'g'), '').trim())
      : null;
  });
}

describe('addrcheck', (): void => {
  beforeAll((): void => {
    jest.setTimeout(5 * 60 * 1000);
  });

  it('has all known addresses', async (): Promise<void> => {
    const ours = await retrieveAddrList();
    const all = Object.values(ours).reduce((all: string[], addrs: string[]): string[] => {
      all.push(...addrs);

      return all;
    }, []);
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
    const mapFound = results.reduce((all, [site, found]) => ({ ...all, [site]: found }), {});
    const mapMiss = results
      .map(([site, found]): [string, string[]] => [site, found.filter((a) => !all.includes(a))])
      .filter(([, found]) => found.length)
      .reduce((all, [site, found]) => ({ ...all, [site]: found }), {});
    const sites = Object.keys(mapMiss);

    console.log('All available\n', JSON.stringify(mapFound, null, 2));
    console.log('All missing\n', JSON.stringify(mapMiss, null, 2));

    logMissing(mapMiss);

    expect(sites).toEqual([]);
  });
});
