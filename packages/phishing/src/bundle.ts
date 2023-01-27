// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AddressList, HostList } from './types';

import { u8aEq } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

import { fetchJson } from './fetch';

export { packageInfo } from './packageInfo';

interface Cache<T> {
  end: number;
  list: T | null;
}

// Equivalent to https://raw.githubusercontent.com/polkadot-js/phishing/master/{address,all}.json
const PHISHING = 'https://polkadot.js.org/phishing';
const ADDRESS_JSON = `${PHISHING}/address.json`;
// 45 minutes cache refresh
const CACHE_TIMEOUT = 45 * 60 * 1000;

let cacheAddrU8a: [string, Uint8Array[]][] | null = null;
const cacheAddr: Cache<AddressList> = {
  end: 0,
  list: null
};
const cacheHost: Record<string, Cache<HostList>> = {
  __: {
    end: 0,
    list: null
  }
};

function extractHostParts (host: string): string[] {
  return host
    // remove protocol
    .replace(/https:\/\/|http:\/\/|wss:\/\/|ws:\/\//, '')
    // get the domain-only part
    .split('/')[0]
    // split domain
    .split('.')
    // reverse order
    .reverse();
}

/**
 * Retrieve a list of known phishing addresses
 */
export async function retrieveAddrList (allowCached = true): Promise<AddressList> {
  const now = Date.now();

  if (allowCached && cacheAddr.list && (now < cacheAddr.end)) {
    return cacheAddr.list;
  }

  const list = await fetchJson<AddressList>(ADDRESS_JSON);

  cacheAddr.end = now + CACHE_TIMEOUT;
  cacheAddr.list = list;

  return list;
}

/**
 * Retrieve a list of known phishing addresses in raw Uint8Array format
 */
async function retrieveAddrU8a (allowCached = true): Promise<[string, Uint8Array[]][]> {
  const now = Date.now();

  if (allowCached && cacheAddrU8a && (now < cacheAddr.end)) {
    return cacheAddrU8a;
  }

  const all = await retrieveAddrList(allowCached);

  cacheAddrU8a = Object
    .entries(all)
    .map(([key, addresses]): [string, Uint8Array[]] =>
      [key, addresses.map((a) => decodeAddress(a))]
    );

  return cacheAddrU8a;
}

/**
 * Retrieve allow/deny from our list provider
 */
export async function retrieveHostList (allowCached = true, root = '*'): Promise<HostList> {
  const now = Date.now();
  let list = allowCached && cacheHost[root] && (now < cacheHost[root].end) && cacheHost[root].list;

  if (list) {
    return list;
  }

  try {
    list = root === '*'
      ? await fetchJson<HostList>(`${PHISHING}/all.json`)
      : {
        allow: [],
        deny: await fetchJson<string[]>(`${PHISHING}/all/${root}/all.json`)
      };
  } catch {
    list = { allow: [], deny: [] };
  }

  cacheHost[root] = {
    end: now + CACHE_TIMEOUT,
    list
  };

  return list;
}

function checkHostParts (items: string[], hostParts: string[]): boolean {
  return items.some((item): boolean => {
    const checkParts = extractHostParts(item);

    // first we need to ensure it has less or equal parts to our source
    if (checkParts.length > hostParts.length) {
      return false;
    }

    // ensure each section matches
    return checkParts.every((part, index) => hostParts[index] === part);
  });
}

/**
 * Checks a host to see if it appears in the provided list
 */
export function checkHost (items: string[], host: string): boolean {
  return checkHostParts(items, extractHostParts(host));
}

/**
 * Determines if a host is in our deny list. Returns a string containing the phishing site if host is a
 * problematic one. Returns null if the address is not associated with phishing.
 */
export async function checkAddress (address: string | Uint8Array, allowCached = true): Promise<string | null> {
  try {
    const u8a = decodeAddress(address);
    const all = await retrieveAddrU8a(allowCached);
    const entry = all.find(([, all]) => all.some((a) => u8aEq(a, u8a))) || [null];

    return entry[0];
  } catch {
    return null;
  }
}

/**
 * Determines if a host is in our deny list. Returns true if host is a problematic one. Returns
 * false if the host provided is not in our list of less-than-honest sites.
 */
export async function checkIfDenied (host: string, allowCached = true): Promise<boolean> {
  try {
    const hostParts = extractHostParts(host);
    const { deny } = await retrieveHostList(allowCached, hostParts[0]);

    return checkHostParts(deny, hostParts);
  } catch {
    return false;
  }
}
