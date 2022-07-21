// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

import { decodeAddress } from '@polkadot/util-crypto';

type JsonAddr = Record<string, string[]>;
type JsonAll = { allow: string[]; deny: string[] };
type JsonMetaIdx = string[];
type JsonMeta = { date: string, url: string }[];

function readJson <R> (name: string): R {
  return JSON.parse(fs.readFileSync(name, 'utf-8')) as R;
}

const addresses = readJson<JsonAddr>('address.json');
const allowed = readJson<JsonAddr>('known.json');
const all = readJson<JsonAll>('all.json');
const meta = readJson<JsonMetaIdx>('meta/index.json').reduce<JsonMeta>((all, name) => {
  const meta = readJson<JsonMeta>(`meta/${name}.json`);

  return all.concat(meta);
}, []);

const TOP_LEVEL = [
  // wildcards
  '*.fleek.co', // storageapi.fleek.co, storageapi2.fleek.co
  'on.fleek.co',

  // root domains
  'ddns.net',
  'ddns.us',
  'github.io',
  'herokuapp.com',
  'hopto.org',
  'js.org',
  'netlify.app',
  'pagekite.me',
  'pages.dev',
  'plesk.page',
  'servehttp.com',
  'sytes.net',
  'timeweb.ru',
  'vercel.app',
  'web.app',
  'webflow.io',
  'weebly.com',
  'wixsite.com',
  'zapto.org'
];

describe('added addresses', (): void => {
  it('has no malformed addresses', (): void => {
    const invalids = Object
      .entries(addresses)
      .map(([url, addrs]): [string, string[]] => {
        return [url, addrs.filter((a) => {
          try {
            return decodeAddress(a).length !== 32;
          } catch (error) {
            console.error(url, (error as Error).message);

            return true;
          }
        })];
      })
      .filter(([, addrs]) => addrs.length);

    if (invalids.length) {
      throw new Error(`Invalid ss58 checksum addresses found: ${invalids.map(([url, addrs]) => `\n\t${url}: ${addrs.join(', ')}`).join('')}`);
    }
  });

  it('has no entries on the known addresses list', (): void => {
    const added = Object
      .values(addresses)
      .reduce<string[]>((all, addrs) => all.concat(addrs), []);
    const dupes = Object
      .entries(allowed)
      .reduce<[string, string][]>((all, [site, addrs]) => all.concat(addrs.map((a) => [site, a])), [])
      .filter(([, a]) => added.includes(a));

    expect(dupes).toEqual([]);
  });
});

describe('added urls', (): void => {
  it('has no entries for allowed top-level domains', (): void => {
    const invalids = all.deny.filter((u) =>
      TOP_LEVEL.some((t) =>
        // for *. count the parts before the check
        (t.startsWith('*.') && (u.split('.').length === t.split('.').length))
          ? (u.endsWith(t.substring(1)) || u === t.substring(2))
          : u === t
      )
    );

    expect(invalids).toEqual([]);
  });

  it('has no malformed domain-only entries', (): void => {
    const invalids = all.deny.filter((u) =>
      u.includes('/') || // don't allow paths
      u.includes('?') || // don't allow query params
      u.includes(' ') || // no spaces
      !u.includes('.') // need at least a domain
    );

    expect(invalids).toEqual([]);
  });

  it('has no urls starting with www. (domain-only inclusions)', (): void => {
    const invalids = all.deny.filter((u) =>
      u.startsWith('www.')
    );

    expect(invalids).toEqual([]);
  });

  it('has no entries previously added', (): void => {
    const dupes = all.deny
      .map((url) => {
        const prev = meta.find((m) => m.url === url);

        return prev
          ? `${prev.url} added on ${prev.date}`
          : null;
      })
      .filter((v) => !!v);

    expect(
      process.env.CI_LOG
        ? []
        : dupes
    ).toEqual([]);
  });
});
