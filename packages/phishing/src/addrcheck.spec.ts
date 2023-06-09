// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev-test/globals.d.ts" />

import fs from 'node:fs';

import { decodeAddress } from '@polkadot/util-crypto';

import { fetchJson, fetchText } from './fetch.js';

const TICKS = '```';
const TIMEOUT = 5000;

const ourAddrList = JSON.parse(fs.readFileSync('address.json', 'utf-8')) as Record<string, string[]>;

// loop through each site for a number of times, applying the transform
async function loopSome (site: string, matcher: () => Promise<string[] | null>): Promise<[string, string[]]> {
  const found: string[] = [];

  for (let i = 0; i < 10; i++) {
    try {
      const addresses = await matcher();

      addresses && addresses.forEach((address): void => {
        if (address && !found.includes(address)) {
          found.push(address);
        }
      });
    } catch {
      // console.error(error);
    }

    await new Promise<boolean>((resolve) =>
      setTimeout(
        () => resolve(true),
        Math.floor((Math.random() * 750) + 1000)
      )
    );
  }

  return [site, found];
}

// shared between polkadot.center & polkadot-event.com (addresses are also the same on first run)
function checkGetWallet (site: string): Promise<[string, string[]]> {
  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await fetchJson<{ wallet?: string }>(`https://${site}/get_wallet.php`, TIMEOUT);

    return result?.wallet
      ? [result.wallet.replace('\r', '').trim()]
      : null;
  });
}

// extract a specific tag from attributes
function checkTag (url: string, tag: string, attr?: string): Promise<[string, string[]]> {
  const site = url.split('/')[2];

  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await fetchText(url, TIMEOUT);

    // /<p id="trnsctin">(.*?)<\/p>/g
    const match = new RegExp(`<${tag}${attr ? ` ${attr}` : ''}>(.*?)</${tag}>`, 'g').exec(result);

    // /<\/?p( id="trnsctin")?>/g
    return match && match.length
      ? match.map((v) =>
        v
          .replace(new RegExp(`</?${tag}${attr ? `( ${attr})?` : ''}>`, 'g'), '')
          .replace(/<br>/g, '')
          .replace(/<\/br>/g, '')
          .trim()
      )
      : null;
  });
}

// extract a specific attribute from a tag
function checkAttr (url: string, attr: string): Promise<[string, string[]]> {
  const site = url.split('/')[2];

  return loopSome(site, async (): Promise<string[] | null> => {
    const result = await fetchText(url, TIMEOUT);
    const match = new RegExp(`${attr}"[a-zA-Z0-9]+"`, 'g').exec(result);

    return match && match.length
      ? [match[0].replace(new RegExp(attr, 'g'), '').replace(/"/g, '').trim()]
      : null;
  });
}

// all the available checks
function checkAll (): Promise<[string, string[]][]> {
  return Promise.all([
    ...[
      'https://get-dot.me/'
    ].map((u) => checkTag(u, 'div', 'class="wallet" id="code" style="width: 100%"')),
    ...[
      'polkadot.center',
      'polkadot-event.com'
    ].map((u) => checkGetWallet(u)),
    ...[
      'https://polkadotlive.network/block-assets/index.html',
      'https://polkadots.network/block.html',
      'https://polkadot-gift.org/block.html'
    ].map((u) => checkTag(u, 'p', 'id="trnsctin"')),
    ...[
      'https://polkacoinbonus.com/verification/index.html',
      'https://polkagiveaway.com/verification/index.html',
      'https://polkadot.activebonus.live/claim/'
    ].map((u) => checkTag(u, 'span', 'id="trnsctin"')),
    ...[
      'https://airdropcampaign-polkadot.network/block/index.html',
      'https://claimpolka.com/claim/index.html',
      'https://claimpolka.live/claim/index.html',
      'https://claimpolkadot.com/claim/index.html',
      'https://claimpolkadot.network/claim/index.html',
      'https://claimpolkadot.live/claim/index.html',
      'https://polkaeco-airdrops.org/dot/index.html',
      'https://polkadot-airdrop.org/block/index.html',
      'https://polkadot-airdrop.online/block/index.html',
      'https://polkadot-airdropcampaign.network/block/index.html',
      'https://polkadot-airdropevent.network/block/index.html',
      'https://polkadot-airdrops.net/block/index.html',
      'https://polkadot-bonus.live/dot/index.html',
      'https://polkadot-bonus.network/block/index.html',
      'https://polkadot.deals/claim/index.html',
      'https://polkadotstake.live/claim/index.html'
    ].map((u) => checkTag(u, 'span', 'class="real-address"')),
    ...[
      'https://polkadot-get.com/',
      'https://polkadot-promo.info/'
    ].map((u) => checkTag(u, 'span', 'id="cosh"')),
    ...[
      'https://dot21.org/promo/',
      'https://dot4.org/promo/',
      'https://dot4.top/promo/'
    ].map((u) => checkTag(u, 'p', 'class="payment-title"')),
    ...[
      'https://getpolkadot.us/',
      'https://musk-in.com'
    ].map((u) => checkTag(u, 'h5', 'class="transaction-address"')),
    ...[
      'https://getpolkadot.us/',
      'https://musk-in.com',
      'https://polkadot-autopool.com/dot/index.html'
    ].map((u) => checkAttr(u, 'data-clipboard-text=')),
    ...[
      'https://kusama-wallet.com/wallet.php',
      'https://polkadot-wallet.org/wallet.php'
    ].map((u) => checkAttr(u, 'id="copyTarget" value=')),
    ...[
      'https://polkadot-online.com/nnn/polkadot-live.online/block/index.html',
      'https://polkadot-online.live/nnn/polkadot-live.online/block/index.html'
    ].map((u) => checkTag(u, 'p', 'id="t12uEsctin"')),
    checkTag('https://polkadot-gift.info/', 'span', 'id="wallet"'),
    checkTag('https://polkadotairdrop.com/address/', 'cool')
  ]);
}

describe('addrcheck', (): void => {
  let counter = 0;
  let errors = 0;

  afterEach((): void => {
    if (++counter === 1) {
      process.exit(errors);
    }
  });

  it('has all known addresses', async (): Promise<void> => {
    errors++;

    const _results = await checkAll();
    const results = _results.map(([url, addrs]): [string, string[]] => {
      return [url, addrs.filter((a) => {
        try {
          return decodeAddress(a).length === 32;
        } catch (error) {
          console.error(url, (error as Error).message);

          return false;
        }
      })];
    });
    const all = Object.values(ourAddrList).reduce((all: string[], addrs: string[]): string[] => {
      all.push(...addrs);

      return all;
    }, []);
    const listEmpty = results.filter(([, found]) => !found.length).map(([site]) => site);
    const mapFound = results.filter(([, found]) => found.length).reduce((all, [site, found]) => ({ ...all, [site]: found }), {});
    const mapMiss = results
      .map(([site, found]): [string, string[]] => [site, found.filter((a) => !all.includes(a))])
      .filter(([, found]) => found.length)
      .reduce((all: Record<string, string[]>, [site, found]) => ({
        ...all,
        [site]: (all[site] || []).concat(found)
      }), {});
    const sites = Object.keys(mapMiss);

    console.log('Sites with no results\n', JSON.stringify(listEmpty, null, 2));
    console.log('Addresses found\n', JSON.stringify(mapFound, null, 2));
    console.log('Addresses missing\n', JSON.stringify(mapMiss, null, 2));

    sites.length && process.env['CI_LOG'] && fs.appendFileSync('./.github/addrcheck.md', `\n\n${sites.length} urls with missing entries found at ${new Date().toUTCString()}:\n\n${TICKS}\n${JSON.stringify(mapMiss, null, 2)}\n${TICKS}\n`);

    expect(sites).toEqual([]);

    errors--;
  });
});
