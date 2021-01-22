// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AddressList, HostList } from './types';

import { u8aEq } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { fetch } from '@polkadot/x-fetch';

// Equivalent to https://raw.githubusercontent.com/polkadot-js/phishing/master/{address,all}.json
const ADDRESS_JSON = 'https://polkadot.js.org/phishing/address.json';
const ALL_JSON = 'https://polkadot.js.org/phishing/all.json';
// 1 hour cache refresh
const CACHE_TIMEOUT = 45 * 60 * 1000;

let cacheAddrEnd = 0;
let cacheAddrList: AddressList | null = null;
let cacheHostEnd = 0;
let cacheHostList: HostList | null = null;

// gets the host-only part for a host
function extractHost (path: string): string {
  return path
    .replace(/https:\/\/|http:\/\/|wss:\/\/|ws:\/\//, '')
    .split('/')[0];
}

/**
 * Retrieve a list of known phishing addresses
 */
export async function retrieveAddrList (allowCached = true): Promise<AddressList> {
  const now = Date.now();

  if (allowCached && cacheAddrList && (now < cacheAddrEnd)) {
    return cacheAddrList;
  }

  const response = await fetch(ADDRESS_JSON);
  const list = (await response.json()) as AddressList;

  cacheAddrEnd = now + CACHE_TIMEOUT;
  cacheAddrList = list;

  return list;
}

async function retrieveAddrU8a (allowCached = true): Promise<[string, Uint8Array[]][]> {
  const all = await retrieveAddrList(allowCached);

  return Object
    .entries(all)
    .map(([key, addresses]): [string, Uint8Array[]] => [key, addresses.map((a) => decodeAddress(a))]);
}

/**
 * Retrieve allow/deny from our list provider
 */
export async function retrieveHostList (allowCached = true): Promise<HostList> {
  const now = Date.now();

  if (allowCached && cacheHostList && (now < cacheHostEnd)) {
    return cacheHostList;
  }

  const response = await fetch(ALL_JSON);
  const list = (await response.json()) as HostList;

  cacheHostEnd = now + CACHE_TIMEOUT;
  cacheHostList = list;

  return list;
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
    const all = await retrieveAddrU8a(allowCached);
    const u8a = decodeAddress(address);
    const entry = all.find(([, all]) => all.some((a) => u8aEq(a, u8a))) || [null];

    return entry[0];
  } catch (error) {
    console.error('Exception while checking host, assuming false');
    console.error(error);

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
    console.error('Exception while checking host, assuming false');
    console.error(error);

    return false;
  }
}
