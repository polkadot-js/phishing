// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev-test/globals.d.ts" />

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

const ours = (
  JSON.parse(fs.readFileSync('all.json', 'utf-8')) as { allow: string[]; deny: string[] }
).deny;

function matchName (_url: string): boolean {
  const url = (_url || '').toLowerCase();

  return !!url && (url.includes('polka') || url.includes('kusa'));
}

function isSubdomain (ours: string[], url: string) {
  const parts = url.split('.');

  for (let i = 1; i < parts.length - 1; i++) {
    if (ours.includes(parts.slice(i).join('.'))) {
      // this is a sub-domain of a domain that already exists
      return true;
    }
  }

  return false;
}

function assertDetails (site: string, list: string[]): void {
  const missing = list.filter((url) =>
    !ours.includes(url) &&
    !isSubdomain(ours, url)
  );

  console.log(`${site} found\n`, JSON.stringify(list, null, 2));
  console.log(`${site} missing\n`, JSON.stringify(missing, null, 2));

  if (missing.length) {
    process.env['CI_LOG'] && fs.appendFileSync('./.github/crosscheck.md', `

Missing entries found from ${site}:

${TICKS}
${JSON.stringify(missing, null, 2)}
${TICKS}
`);

    throw new Error(site);
  }
}

const CRYPTODB = 'https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml';
const ETHPHISH = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json';

describe('crosscheck', (): void => {
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

    assertDetails(
      'CryptoScamDb',
      scamDb
        .filter(({ name, subcategory, url }) =>
          matchName(subcategory) ||
          matchName(name) ||
          matchName(url)
        )
        .map(({ url }) =>
          url.replace(/https:\/\/|http:\/\//, '').split('/')[0]
        )
    );
    expect(true).toBe(true);

    errors--;
  });

  it('has polkadot/kusama entries from eth-phishing-detect', async (): Promise<void> => {
    errors++;

    const ethDb = await fetchJson<EthPhishing>(ETHPHISH);

    assertDetails(
      'eth-phishing-detect',
      ethDb
        .blacklist
        .filter((url) =>
          matchName(url)
        )
    );
    expect(true).toBe(true);

    errors--;
  });
});
