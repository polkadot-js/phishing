// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import ourSiteList from '../../../all.json';

const IGNORE = ['com.au', 'com.co', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.es', 'com.pl', 'com.pl', 'com.pl', 'com.pl', 'com.pl', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.ru', 'com.se', 'cn.com', 'de.com', 'eu.com', 'js.org', 'my.id', 'us.com', 'us.org', 'web.app', 'za.com', '000webhostapp.com', 'gr.com', 'in.net'];
const TICKS = '```';

function assertAndLog (missing: string[]): void {
  if (missing.length) {
    process.env.CI_LOG && fs.appendFileSync('./.github/dupecheck.md', `

Non top-level specified sites:

${TICKS}
${JSON.stringify(missing, null, 2)}
${TICKS}
`);

    throw new Error(missing.join(', '));
  }
}

describe('crosscheck', (): void => {
  const ours: string[] = ourSiteList.deny;

  beforeAll((): void => {
    jest.setTimeout(120000);
  });

  it('has all top-most specified', (): void => {
    assertAndLog(
      ours
        .map((u): string => {
          const parts = u.split('.');

          return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        })
        .filter((u) => !IGNORE.includes(u) && !ours.includes(u))
        .sort()
    );
  });
});
