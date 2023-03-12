// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev/node/test/node.d.ts" />

import { load as yamlParse } from 'js-yaml';
import fs from 'node:fs';
import process from 'node:process';

import { fetchJson, fetchText } from './fetch.js';

interface CryptoScamEntry {
  addresses: Record<string, string[]>;
  category: string;
  description: string;
  name: string;
  resporter: string;
  subcategory: string;
  url: string;
}

interface EthPhishing {
  blacklist: string[];
}

const TICKS = '```';

const ourSiteList = JSON.parse(fs.readFileSync('all.json', 'utf-8')) as { allow: string[]; deny: string[] };

function assertAndLog (check: boolean, site: string, missing: unknown): void {
  if (!check) {
    process.env.CI_LOG && fs.appendFileSync('./.github/crosscheck.md', `

Missing entries found from ${site}:

${TICKS}
${JSON.stringify(missing, null, 2)}
${TICKS}
`);

    throw new Error(site);
  }
}

function matchName (_url: string): boolean {
  const url = (_url || '').toLowerCase();

  return !!url && (url.includes('polka') || url.includes('kusa'));
}

const CRYPTODB = 'https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml';
const ETHPHISH = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json';

describe('crosscheck', (): void => {
  const ours: string[] = ourSiteList.deny;
  let counter = 0;
  let errors = 0;

  afterEach((): void => {
    if (++counter === 2) {
      process.exit(errors);
    }
  });

  it('has all the relevant entries from CryptoScamDb', async (): Promise<void> => {
    errors++;

    const raw = await fetchText(CRYPTODB);

    // this is a hack, the text slipped in upstream
    const scamDb = yamlParse(raw.replace('∂ç', '')) as CryptoScamEntry[];
    const filtered = scamDb.filter(({ name, subcategory }) => matchName(subcategory) || matchName(name));
    const missing = filtered.filter(({ url }) =>
      !ours.includes(url.replace(/https:\/\/|http:\/\//, '').split('/')[0])
    );

    console.log('CryptoScamDb found\n', JSON.stringify(filtered, null, 2));
    console.log('CryptoScamDb missing\n', JSON.stringify(missing, null, 2));

    assertAndLog(missing.length === 0, 'CryptoScamDB', missing);

    errors--;
  });

  it('has polkadot/kusama entries from eth-phishing-detect', async (): Promise<void> => {
    errors++;

    const ethDb = await fetchJson<EthPhishing>(ETHPHISH);
    const filtered = ethDb.blacklist.filter((url) => matchName(url));
    const missing = filtered.filter((url) => !ours.includes(url));

    console.log('eth-phishing-detect found\n', JSON.stringify(filtered, null, 2));
    console.log('eth-phishing-detect missing\n', JSON.stringify(missing, null, 2));

    assertAndLog(missing.length === 0, 'eth-phishing-detect', missing);

    errors--;
  });
});
