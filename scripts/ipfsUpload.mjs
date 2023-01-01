// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import pinataSDK from '@pinata/sdk';
import cloudflare from 'dnslink-cloudflare';

const SUB_DOMAIN = 'phishing';
const DOMAIN = 'dotapps.io';
const DST = 'build';
const PINMETA = { name: `${SUB_DOMAIN}.${DOMAIN}` };

const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

async function pin () {
  const result = await pinata.pinFromFS(DST, { pinataMetadata: PINMETA });

  console.log(`Pinned ${result.IpfsHash}`);

  return result.IpfsHash;
}

async function unpin (exclude) {
  const result = await pinata.pinList({ metadata: PINMETA, status: 'pinned' });

  if (result.count > 1) {
    const filtered = result.rows
      .map((r) => r.ipfs_pin_hash)
      .filter((hash) => hash !== exclude);

    if (filtered.length) {
      await Promise.all(
        filtered.map((hash) =>
          pinata
            .unpin(hash)
            .then(() => console.log(`Unpinned ${hash}`))
            .catch(console.error)
        )
      );
    }
  }
}

async function dnslink (hash) {
  const records = [`_dnslink.${SUB_DOMAIN}.${DOMAIN}`];

  await Promise.all(records.map((record) =>
    cloudflare(
      { token: process.env.CF_API_TOKEN },
      { link: `/ipfs/${hash}`, record, zone: DOMAIN }
    )
  ));

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
