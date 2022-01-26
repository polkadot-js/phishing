// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetch } from '@polkadot/x-fetch';

const TIMEOUT = 2000;

// a fetch with a 2s timeout
export async function fetchJson <T> (url: string): Promise<T> {
  const controller = new AbortController();
  let isAborted = false;
  const id = setTimeout((): void => {
    console.log(`Timeout on ${url}`);

    isAborted = true;
    controller.abort();
  }, TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal }).then<T>((r) => r.json());

    clearTimeout(id);

    return response;
  } catch (error) {
    if (!isAborted) {
      clearTimeout(id);
    }

    throw error;
  }
}
