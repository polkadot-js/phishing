// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import test from 'ava';
import fs from 'fs';
import { load as yamlParse } from 'js-yaml';

import { fetch } from '@polkadot/x-fetch';

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

function log (check: boolean, site: string, missing: unknown): void {
  !check && process.env.CI_LOG && fs.appendFileSync('./.github/crosscheck.md', `

Missing entries found from ${site}:

${TICKS}
${JSON.stringify(missing, null, 2)}
${TICKS}
`);
}

function matchName (_url: string): boolean {
  const url = (_url || '').toLowerCase();

  return !!url && (url.includes('polka') || url.includes('kusa'));
}

const CRYPTODB = 'https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml';
const ETHPHISH = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json';

const ours: string[] = ourSiteList.deny;

test('CI: has all the relevant entries from CryptoScamDb', async (t): Promise<void> => {
  t.timeout(120000);

  const raw = await fetch(CRYPTODB).then((r) => r.text());

  // this is a hack, the text slipped in upstream
  const scamDb = yamlParse(raw.replace('∂ç', '')) as CryptoScamEntry[];
  const filtered = scamDb.filter(({ name, subcategory }) => matchName(subcategory) || matchName(name));
  const missing = filtered.filter(({ url }) =>
    !ours.includes(url.replace(/https:\/\/|http:\/\//, '').split('/')[0])
  );

  // console.log('CryptoScamDb found\n', JSON.stringify(filtered, null, 2));
  // console.log('CryptoScamDb missing\n', JSON.stringify(missing, null, 2));

  log(missing.length === 0, 'CryptoScamDB', missing);

  t.true(missing.length === 0);
});

test('CI: has polkadot/kusama entries from eth-phishing-detect', async (t): Promise<void> => {
  t.timeout(120000);

  const ethDb = await fetch(ETHPHISH).then<EthPhishing>((r) => r.json());
  const filtered = ethDb.blacklist.filter((url) => matchName(url));
  const missing = filtered.filter((url) => !ours.includes(url));

  // console.log('eth-phishing-detect found\n', JSON.stringify(filtered, null, 2));
  // console.log('eth-phishing-detect missing\n', JSON.stringify(missing, null, 2));

  log(missing.length === 0, 'eth-phishing-detect', missing);

  t.true(missing.length === 0);
});
