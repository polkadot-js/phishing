// Copyright 2020-2022 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

const KNOWN_URLS = ['telegra.ph', 'twitter.com', 'youtube.com'];

function sanitizeUrl (url) {
  return (
    url.includes('://')
      ? url.split('://')[1]
      : url
  ).split('/')[0];
}

function sortSection (list) {
  return list
    .map((entry) => sanitizeUrl(entry))
    .reduce((filtered, entry) => {
      !filtered.includes(entry) &&
        filtered.push(entry);

      return filtered;
    }, [])
    .sort((a, b) => a.localeCompare(b));
}

function removeSubs (list) {
  return list.filter((entry) =>
    // ignore, we already have the second part of this included,
    // this is a sub-domain of a doiman that alreeady exists
    !list.includes(entry.split('.').slice(1).join('.'))
  );
}

function sortAddresses (values) {
  return Object
    .entries(values)
    .map(([key, address]) => [sanitizeUrl(key), address])
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((all, [key, addresses]) => {
      if (!all[key]) {
        all[key] = [];
      }

      sortSection(addresses).forEach((addr) => {
        !all[key].includes(addr) &&
          all[key].push(addr);
      });

      return all;
    }, {});
}

function addSites ({ allow, deny }, values) {
  return Object
    .keys(values)
    .reduce((filtered, url) => {
      url.includes('.') && !url.includes(' ') && !url.includes('/') && !allow.includes(url) && !filtered.includes(url) && !KNOWN_URLS.includes(url) &&
        filtered.push(url);

      return filtered;
    }, deny);
}

function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson (file, contents) {
  fs.writeFileSync(file, `${JSON.stringify(contents, null, '\t')}\n`);
}

function readMeta () {
  const months = readJson('meta/index.json');
  const meta = [];

  for (const month of months) {
    const items = readJson(`meta/${month}.json`);

    for (const item of items) {
      meta.push(item);
    }
  }

  return meta;
}

export function writeMeta (meta) {
  const months = {};
  const index = [];

  for (const item of meta) {
    const month = item.date.split('-').slice(0, 2).join('-');

    if (!index.includes(month)) {
      index.push(month);
      months[month] = [];
    }

    months[month].push(item);
  }

  for (const month of Object.keys(months)) {
    writeJson(`meta/${month}.json`, months[month]);
  }

  writeJson('meta/index.json', index.sort((a, b) => b.localeCompare(a)));
}

const addr = readJson('address.json');
const all = readJson('all.json');
const meta = readMeta();
const deny = sortSection(addSites(all, addr));

// rewrite with all our entries (newline included)
writeJson('address.json', sortAddresses(addr));
writeJson('all.json', { allow: sortSection(all.allow), deny: removeSubs(deny) });

// find out what we don't have
const urls = meta.map(({ url }) => url);
const now = new Date();
const ym = `${now.getUTCFullYear()}-${`00${now.getUTCMonth() + 1}`.slice(-2)}`;
const ymd = `${ym}-${`00${now.getUTCDate()}`.slice(-2)}`;

// rewrite with all our entries (newline included)
writeMeta(
  meta
    .concat(
      deny
        .filter((url) => !urls.includes(url))
        .map((url) => ({ date: ymd, url }))
    )
    .filter(({ url }) =>
      // direct inclusion
      deny.includes(url) ||
      // indirect, this is a sub-domain (doesn't appear directlt)
      deny.includes(url.split('.').slice(1).join('.'))
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
);
