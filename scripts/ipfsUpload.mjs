// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PinataSDK from '@pinata/sdk';
import cloudflare from 'dnslink-cloudflare';

const SUB_DOMAIN = 'phishing';
const DOMAIN = 'dotapps.io';
const DST = 'build';
const PINMETA = { name: `${SUB_DOMAIN}.${DOMAIN}` };

const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY
});

async function wait (delay = 2500) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}

async function pin () {
  const result = await pinata.pinFromFS(DST, { pinataMetadata: PINMETA });

  console.log(`Pinned ${result.IpfsHash}`);

  await wait();

  return result.IpfsHash;
}

async function unpin (exclude) {
  const result = await pinata.pinList({ metadata: PINMETA, status: 'pinned' });

  await wait();

  if (result.count > 1) {
    const hashes = result.rows
      .map((r) => r.ipfs_pin_hash)
      .filter((hash) => hash !== exclude);

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
}

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

main()
  .catch(console.error)
  .finally(() => process.exit());
