// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { safeLoad } from 'js-yaml';

import fetch from '@polkadot/x-fetch';

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

function assertAndLog (check: boolean, error: string): void {
  if (!check) {
    process.env.CI_LOG && fs.appendFileSync('./.github/crosscheck.md', `

${error}
`);

    throw new Error(error);
  }
}

const CRYPTOSCAM = 'https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml';

describe('crosscheck', (): void => {
  let scamDb: CryptoScamEntry[];
  let ours: string[];

  beforeAll(async (): Promise<void> => {
    ours = (await retrieveHostList()).deny;
    scamDb = safeLoad(await (await fetch(CRYPTOSCAM)).text()) as CryptoScamEntry[];
  });

  it('has all the relevant entries from CryptoScamDb', (): void => {
    const filtered = scamDb.filter(({ subcategory }) => subcategory === 'Polkadot');
    const missing = filtered.filter(({ url }) =>
      !ours.includes(url.replace(/https:\/\/|http:\/\//, '').split('/')[0])
    );

    console.log(JSON.stringify(filtered, null, 2));

    assertAndLog(missing.length === 0, `Missing entries found from CryptoScamDB: ${JSON.stringify(missing, null, 2)}`);
  });
});
