// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PinataSDK from '@pinata/sdk';
// @ts-expect-error We are not defining our own types for this
import cloudflare from 'dnslink-cloudflare';

/** @typedef {import('@pinata/sdk').default} PinataClient */

const SUB_DOMAIN = 'phishing';
const DOMAIN = 'dotapps.io';
const DST = 'build';
const PINMETA = {
  name: `${SUB_DOMAIN}.${DOMAIN}`
};

/** @type {PinataClient} */
// @ts-expect-error For some reason we have issues here...
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY
});

async function wait (delay = 2500) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), delay);
  });
}

/**
 * @returns {Promise<string>}
 */
async function pin () {
  const result = await pinata.pinFromFS(DST, { pinataMetadata: PINMETA });

  console.log(`Pinned ${result.IpfsHash}`);

  await wait();

  return result.IpfsHash;
}

/**
 * @param {string} exclude
 */
async function unpin (exclude) {
  // @ts-expect-error We can forgo the keyvalues field
  const result = await pinata.pinList({ metadata: PINMETA, status: 'pinned' });

  await wait();

  const hashes = result.rows
    .map((r) => r.ipfs_pin_hash)
    .filter((/** @type { string} */ hash) => hash !== exclude);

  for (let i = 0; i < hashes.length; i++) {
    const hash = hashes[i];

    try {
      await pinata.unpin(hash);

      console.log(`Unpinned ${hash}`);
    } catch (error) {
      console.error(`Failed unpinning ${hash}`, error);
    }

    await wait();
  }
}

/**
 * @param {string} hash
 */
async function dnslink (hash) {
  const records = [`_dnslink.${SUB_DOMAIN}.${DOMAIN}`];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      await cloudflare(
        { token: process.env.CF_API_TOKEN },
        { link: `/ipfs/${hash}`, record, zone: DOMAIN }
      );

      console.log(`Updated dnslink ${record}`);

      await wait();
    } catch (error) {
      console.error(`Failed updating dnslink ${record}`, error);
    }
  }

  console.log(`Dnslink ${hash} for ${records.join(', ')}`);
}

async function main () {
  const hash = await pin();

  await dnslink(hash);
  await unpin(hash);
}

// eslint-disable-next-line promise/catch-or-return
main()
  .catch(console.error)
  .finally(() => process.exit());
