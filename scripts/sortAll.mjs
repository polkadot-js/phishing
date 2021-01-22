// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

function sortSection (values) {
  return values.sort((a, b) => a.localeCompare(b));
}

function sortAddress (values) {
  return Object
    .entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, addresses]) => [key, sortSection(addresses)])
    .reduce((all, [key, addresses]) => ({ ...all, [key]: addresses }), {});
}

const addr = JSON.parse(fs.readFileSync('address.json', 'utf-8'));
const all = JSON.parse(fs.readFileSync('all.json', 'utf-8'));
const meta = JSON.parse(fs.readFileSync('urlmeta.json', 'utf-8'));

// sorted order for all entries
const allow = sortSection(all.allow);
const deny = sortSection(all.deny);

// rewrite with all our entries (newline included)
fs.writeFileSync('address.json', `${JSON.stringify(sortAddress(addr), null, 2)}\n`);
fs.writeFileSync('all.json', `${JSON.stringify({ allow, deny }, null, 2)}\n`);

// find out what we don't have
const urls = meta.map(({ url }) => url);
const now = new Date();
const date = `${now.getUTCFullYear()}-${`00${now.getUTCMonth() + 1}`.slice(-2)}-${`00${now.getUTCDate()}`.slice(-2)}`;

// rewrite with all our entries (newline included)
fs.writeFileSync('urlmeta.json', `${JSON.stringify(
  meta
    .concat(
      deny
        .filter((url) => !urls.includes(url))
        .map((url) => ({ date, url }))
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url)),
  null, 2
)}\n`);
