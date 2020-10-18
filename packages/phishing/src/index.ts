// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HostList } from './types';

import fetch from '@polkadot/x-fetch';

function extractHost (path: string): string {
  return path
    .replace(/https:\/\/|http:\/\/|wss:\/\/|ws:\/\//, '')
    .split('/')[0];
}

// retrieve allow/deny from our list provider
export async function retrieveHostList (): Promise<HostList> {
  const response = await fetch('https://polkadot.js.org/phishing/all.json');
  const list = (await response.json()) as HostList;

  return list;
}

// checks a host to see if it appears in the list
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
 * Determines if a host is in our deny list. Returns tru if host is a problematic one.
 */
export default async function retrieveCheckDeny (host: string): Promise<boolean> {
  const { deny } = await retrieveHostList();

  return checkHost(deny, host);
}
