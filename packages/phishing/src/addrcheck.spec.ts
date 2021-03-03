// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import { fetchWithTimeout } from './fetch';
import { retrieveAddrList } from '.';

const TICKS = '```';

// loop through each site for a number of times, applying the transform
async function loopSome (site: string, matcher: () => Promise<string[] | null>): Promise<[string, string[]]> {
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
      // console.error(error);
    }

    await new Promise<boolean>((resolve) => setTimeout(() => resolve(true), Math.floor((Math.random() * 750) + 1000)));
  }

  return [site, found];
}

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
function checkGetWallet (site: string): Promise<[string, string[]]> {
  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await (await fetchWithTimeout(`https://${site}/get_wallet.php`)).json() as Record<string, string>;

    return (result && result.wallet)
      ? [result.wallet.replace('\r', '').trim()]
      : null;
  });
}

// extract a specific tag from attributes
function checkTag (url: string, tag: string, attr?: string): Promise<[string, string[]]> {
  const site = url.split('/')[2];

  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await (await fetchWithTimeout(url)).text();

    // /<p id="trnsctin">(.*?)<\/p>/g
    const match = new RegExp(`<${tag}${attr ? ` ${attr}` : ''}>(.*?)</${tag}>`, 'g').exec(result);

    // /<\/?p( id="trnsctin")?>/g
    return match && match.length
      ? match.map((v) => v.replace(new RegExp(`</?${tag}${attr ? `( ${attr})?` : ''}>`, 'g'), '').trim())
      : null;
  });
}

// extract a specific attribute from a tag
function checkAttr (url: string, attr: string): Promise<[string, string[]]> {
  const site = url.split('/')[2];

  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await (await fetchWithTimeout(url)).text();

    const regex = new RegExp(`${attr}"[a-zA-Z0-9]+"`, 'g');
    const match = regex.exec(result);

    return match && match.length
      ? [match[0].replace(new RegExp(attr, 'g'), '').replace(/"/g, '').trim()]
      : null;
  });
}

// all the available checks
function checkAll (): Promise<[string, string[]][]> {
  return Promise.all([
    ...[
      'polkadot.center',
      'polkadot-event.com'
    ].map((u) => checkGetWallet(u)),
    ...[
      'https://polkadotlive.network/block-assets/index.html',
      'https://polkadots.network/block.html'
    ].map((u) => checkTag(u, 'p', 'id="trnsctin"')),
    ...[
      'https://claimpolka.live/claim/index.html',
      'https://polkadot-airdrop.org/block/index.html',
      'https://polkadot-airdrop.online/block/index.html',
      'https://polkadot-airdrops.net/block/index.html',
      'https://polkadot-bonus.network/block/index.html'
    ].map((u) => checkTag(u, 'span', 'class="real-address"')),
    ...[
      'https://polkadot-get.com/',
      'https://polkadot-promo.info/'
    ].map((u) => checkTag(u, 'span', 'id="cosh"')),
    checkTag('https://dot4.org/promo/', 'p', 'class="payment-title"'),
    checkTag('https://polkadotairdrop.com/address/', 'cool'),
    checkAttr('https://kusama-wallet.com/wallet.php', 'id="copyTarget" value=')
  ]);
}

describe('addrcheck', (): void => {
  beforeAll((): void => {
    jest.setTimeout(5 * 60 * 1000);
  });

  it('has all known addresses', async (): Promise<void> => {
    const [ours, results] = await Promise.all([
      retrieveAddrList(),
      checkAll()
    ]);
    const all = Object.values(ours).reduce((all: string[], addrs: string[]): string[] => {
      all.push(...addrs);

      return all;
    }, []);
    const listEmpty = results.filter(([, found]) => !found.length).map(([site]) => site);
    const mapFound = results.filter(([, found]) => found.length).reduce((all, [site, found]) => ({ ...all, [site]: found }), {});
    const mapMiss = results
      .map(([site, found]): [string, string[]] => [site, found.filter((a) => !all.includes(a))])
      .filter(([, found]) => found.length)
      .reduce((all, [site, found]) => ({ ...all, [site]: found }), {});
    const sites = Object.keys(mapMiss);

    console.log('Sites with no results\n', JSON.stringify(listEmpty, null, 2));
    console.log('Addresses found\n', JSON.stringify(mapFound, null, 2));
    console.log('Addresses missing\n', JSON.stringify(mapMiss, null, 2));

    sites.length && process.env.CI_LOG && fs.appendFileSync('./.github/addrcheck.md', `\n\n${sites.length} urls with missing entries found at ${new Date().toUTCString()}:\n\n${TICKS}\n${JSON.stringify(mapMiss, null, 2)}\n${TICKS}\n`);

    expect(sites).toEqual([]);
  });
});
