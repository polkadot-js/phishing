// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { load as yamlParse } from 'js-yaml';

import { fetch } from '@polkadot/x-fetch';

import { retrieveHostList } from '.';

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

function assertAndLog (check: boolean, error: string): void {
  if (!check) {
    process.env.CI_LOG && fs.appendFileSync('./.github/crosscheck.md', `

${error}
`);

    throw new Error(error);
  }
}

const CRYPTODB = 'https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml';
const ETHPHISH = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json';

describe('crosscheck', (): void => {
  let ours: string[];

  beforeAll(async (): Promise<void> => {
    jest.setTimeout(120000);
    ours = (await retrieveHostList()).deny;
  });

  it('has all the relevant entries from CryptoScamDb', async (): Promise<void> => {
    const raw = await (await fetch(CRYPTODB)).text();

    // this is a hack, the text slipped in upstream
    const scamDb = yamlParse(raw.replace('∂ç', '')) as CryptoScamEntry[];
    const filtered = scamDb.filter(({ subcategory }) => subcategory === 'Polkadot');
    const missing = filtered.filter(({ url }) =>
      !ours.includes(url.replace(/https:\/\/|http:\/\//, '').split('/')[0])
    );

    console.log('CryptoScamDb', JSON.stringify(filtered, null, 2));

    assertAndLog(missing.length === 0, `Missing entries found from CryptoScamDB: ${JSON.stringify(missing, null, 2)}`);
  });

  it('has polkadot/kusama entries from eth-phishing-detect', async (): Promise<void> => {
    const ethDb = await (await fetch(ETHPHISH)).json() as EthPhishing;
    const filtered = ethDb.blacklist.filter((url) => url.includes('polkadot') || url.includes('kusama'));
    const missing = filtered.filter((url) => !ours.includes(url));

    console.log('eth-phishing-detect', JSON.stringify(filtered, null, 2));

    assertAndLog(missing.length === 0, `Missing entries found from eth-phishing-detect: ${JSON.stringify(missing, null, 2)}`);
  });
});
