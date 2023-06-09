// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev-test/globals.d.ts" />

import fs from 'node:fs';

import { decodeAddress } from '@polkadot/util-crypto';

const addresses = JSON.parse(fs.readFileSync('address.json', 'utf-8')) as Record<string, string[]>;
const allowed = JSON.parse(fs.readFileSync('known.json', 'utf-8')) as Record<string, string[]>;
const all = JSON.parse(fs.readFileSync('all.json', 'utf8')) as { allow: string[]; deny: string[] };

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

    expect(true).toBe(true);

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
  it('has no entries matching top-level domains in allow', (): void => {
    const invalids = all.deny.filter((u) =>
      all.allow.some((t) =>
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

  it('has no duplicate entries', (): void => {
    const checks: string[] = [];

    const dupes = all.deny.reduce<string[]>((dupes, url) => {
      if (!checks.includes(url)) {
        checks.push(url);
      } else {
        dupes.push(url);
      }

      return dupes;
    }, []);

    expect(
      process.env['CI_LOG']
        ? []
        : dupes
    ).toEqual([]);
  });
});
