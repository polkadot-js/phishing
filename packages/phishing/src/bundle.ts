// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AddressList, HostList } from './types';

import { u8aEq } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

import { fetchJson } from './fetch';

export { packageInfo } from './packageInfo';

// Equivalent to https://raw.githubusercontent.com/polkadot-js/phishing/master/{address,all}.json
const ADDRESS_JSON = 'https://polkadot.js.org/phishing/address.json';
const ALL_JSON = 'https://polkadot.js.org/phishing/all.json';
// 45 minutes cache refresh
const CACHE_TIMEOUT = 45 * 60 * 1000;

let cacheAddrEnd = 0;
let cacheAddrList: AddressList | null = null;
let cacheAddrU8a: [string, Uint8Array[]][] | null = null;
let cacheHostEnd = 0;
let cacheHostList: HostList | null = null;

// gets the host-only part for a host
function extractHost (path: string): string {
  return path
    .replace(/https:\/\/|http:\/\/|wss:\/\/|ws:\/\//, '')
    .split('/')[0];
}

// logs an error in a consistent format
function log (error: unknown, check: string): void {
  console.warn(`Error checking ${check}, assuming non-phishing`, (error as Error).message);
}

/**
 * Retrieve a list of known phishing addresses
 */
export async function retrieveAddrList (allowCached = true): Promise<AddressList> {
  const now = Date.now();

  return (allowCached && cacheAddrList && (now < cacheAddrEnd))
    ? cacheAddrList
    : fetchJson<AddressList>(ADDRESS_JSON).then((list) => {
      cacheAddrEnd = now + CACHE_TIMEOUT;
      cacheAddrList = list;

      return list;
    });
}

/**
 * Retrieve a list of known phishing addresses in raw Uint8Array format
 */
async function retrieveAddrU8a (allowCached = true): Promise<[string, Uint8Array[]][]> {
  const now = Date.now();

  return (allowCached && cacheAddrU8a && (now < cacheAddrEnd))
    ? cacheAddrU8a
    : retrieveAddrList(allowCached).then((all) => {
      cacheAddrU8a = Object
        .entries(all)
        .map(([key, addresses]): [string, Uint8Array[]] =>
          [key, addresses.map((a) => decodeAddress(a))]
        );

      return cacheAddrU8a;
    });
}

/**
 * Retrieve allow/deny from our list provider
 */
export async function retrieveHostList (allowCached = true): Promise<HostList> {
  const now = Date.now();

  return (allowCached && cacheHostList && (now < cacheHostEnd))
    ? cacheHostList
    : fetchJson<HostList>(ALL_JSON).then((list) => {
      cacheHostEnd = now + CACHE_TIMEOUT;
      cacheHostList = list;

      return list;
    });
}

/**
 * Checks a host to see if it appears in the provided list
 */
export function checkHost (items: string[], host: string): boolean {
  const hostParts = extractHost(host).split('.').reverse();

  return items.some((item): boolean => {
    const checkParts = item.split('.').reverse();

    // first we need to ensure it has less or equal parts to our source
    if (checkParts.length > hostParts.length) {
      return false;
    }

    // ensure each section matches
    return checkParts.every((part, index) => hostParts[index] === part);
  });
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
  } catch (error) {
    log(error, 'address');

    return null;
  }
}

/**
 * Determines if a host is in our deny list. Returns true if host is a problematic one. Returns
 * false if the host provided is not in our list of less-than-honest sites.
 */
export async function checkIfDenied (host: string, allowCached = true): Promise<boolean> {
  try {
    const { deny } = await retrieveHostList(allowCached);

    return checkHost(deny, host);
  } catch (error) {
    log(error, host);

    return false;
  }
}
