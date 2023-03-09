// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AddressList, HostList } from './types.js';

import { u8aEq } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

import { fetchJson } from './fetch.js';

export { packageInfo } from './packageInfo.js';

interface Cache<T> {
  end: number;
  list: T;
}

interface CacheAddrList extends Cache<AddressList> {
  u8a: [string, Uint8Array[]][];
}

interface CacheHostList extends Cache<HostList> {
  parts: string[][];
}

// Equivalent to https://raw.githubusercontent.com/polkadot-js/phishing/master/{address,all}.json
const PHISHING = 'https://polkadot.js.org/phishing';
const ADDRESS_JSON = `${PHISHING}/address.json`;
// 45 minutes cache refresh
const CACHE_TIMEOUT = 45 * 60 * 1000;

const cacheAddr: CacheAddrList = {
  end: 0,
  list: {},
  u8a: []
};
const cacheHost: Record<string, CacheHostList> = {};

function splitHostParts (host: string): string[] {
  return host
    // split domain
    .split('.')
    // reverse order
    .reverse();
}

function extractHostParts (host: string): string[] {
  return splitHostParts(
    host
      // remove protocol
      .replace(/https:\/\/|http:\/\/|wss:\/\/|ws:\/\//, '')
      // get the domain-only part
      .split('/')[0]
  );
}

async function retrieveAddrCache (allowCached = true): Promise<CacheAddrList> {
  const now = Date.now();

  if (allowCached && (now < cacheAddr.end)) {
    return cacheAddr;
  }

  const list = await fetchJson<AddressList>(ADDRESS_JSON);

  cacheAddr.end = now + CACHE_TIMEOUT;
  cacheAddr.list = list;
  cacheAddr.u8a = Object.entries(list).map(([key, addresses]): [string, Uint8Array[]] =>
    [key, addresses.map((a) => decodeAddress(a))]
  );

  return cacheAddr;
}

async function retrieveHostCache (allowCached = true, root = '*'): Promise<CacheHostList> {
  const now = Date.now();

  if (allowCached && cacheHost[root] && (now < cacheHost[root].end)) {
    return cacheHost[root];
  }

  let list: HostList;

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
    list,
    parts: list.deny.map((h) => splitHostParts(h))
  };

  return cacheHost[root];
}

function checkHostParts (items: CacheHostList['parts'], hostParts: string[]): boolean {
  return items.some((parts) =>
    // out list entry needs to have the same (or less) parts
    (parts.length <= hostParts.length) &&
    // ensure each section matches
    parts.every((part, index) => hostParts[index] === part)
  );
}

/**
 * Retrieve a list of known phishing addresses
 *
 * @deprecated While not due for removal, it is suggested to rather use the
 * checkAddress function (which is more optimal overall)
 */
export async function retrieveAddrList (allowCached = true): Promise<AddressList> {
  const cache = await retrieveAddrCache(allowCached);

  return cache.list;
}

/**
 * Retrieve allow/deny from our list provider
 *
 * @deprecated While not due for removal, it is suggested to rather use the
 * checkIfDenied function (which is more optimal overall)
 */
export async function retrieveHostList (allowCached = true, root = '*'): Promise<HostList> {
  const cache = await retrieveHostCache(allowCached, root);

  return cache.list;
}

/**
 * Checks a host to see if it appears in the provided list
 *
 * @deprecated While not due for removal, it is suggested to rather use the
 * checkIfDenied function (which is more optimal overall)
 */
export function checkHost (list: string[], host: string): boolean {
  return checkHostParts(list.map((h) => splitHostParts(h)), extractHostParts(host));
}

/**
 * Determines if a host is in our deny list. Returns a string containing the phishing site if host is a
 * problematic one. Returns null if the address is not associated with phishing.
 */
export async function checkAddress (address: string | Uint8Array, allowCached = true): Promise<string | null> {
  try {
    const u8a = decodeAddress(address);
    const cache = await retrieveAddrCache(allowCached);
    const entry = cache.u8a.find(([, u8as]) =>
      u8as.some((a) => u8aEq(a, u8a))
    );

    return (entry && entry[0]) || null;
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
    const cache = await retrieveHostCache(allowCached, hostParts[0]);

    return checkHostParts(cache.parts, hostParts);
  } catch {
    return false;
  }
}
