// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';

import { mkdirpSync, rimrafSync } from '@polkadot/dev/scripts/util.mjs';

const KNOWN_URLS = ['telegra.ph', 'twitter.com', 'youtube.com'];

function sanitizeUrl (url) {
  return (
    url.includes('://')
      ? url.split('://')[1]
      : url
  ).split('/')[0];
}

function filterSection (list) {
  return list
    .map((entry) => sanitizeUrl(entry))
    .reduce((filtered, entry) => {
      !filtered.includes(entry) &&
        filtered.push(entry);

      return filtered;
    }, []);
}

function sortSection (list) {
  return filterSection(list).sort((a, b) => a.localeCompare(b));
}

function isSubdomain (list, url) {
  const parts = url.split('.');

  for (let i = 1; i < parts.length - 1; i++) {
    if (list.includes(parts.slice(i).join('.'))) {
      // this is a sub-domain of a domain that already exists
      return true;
    }
  }

  return false;
}

function flattenUrl (url) {
  // currently we only check for plesk-page to flatten
  if (!url.endsWith('plesk.page')) {
    return url;
  }

  const parts = url.split('.');

  return parts.length > 3
    ? parts.slice(-3).join('.')
    : url;
}

function rewriteSubs (list) {
  return filterSection(
    list
      .filter((url) => !isSubdomain(list, url))
      .map((url) => flattenUrl(url))
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

function writeAllList (deny) {
  rimrafSync('all');
  mkdirpSync('all');

  const avail = deny.reduce((avail, url) => {
    const [top] = url.split('.').reverse();

    if (!avail[top]) {
      avail[top] = [url];
    } else {
      avail[top].push(url);
    }

    return avail;
  }, {});

  Object.entries(avail).forEach(([top, urls]) => {
    mkdirpSync(`all/${top}`);
    writeJson(`all/${top}/all.json`, urls);
  });
}

const addr = readJson('address.json');
const all = readJson('all.json');
const meta = readMeta();
const deny = sortSection(addSites(all, addr));
const allJson = { allow: sortSection(all.allow), deny: rewriteSubs(deny) };

// rewrite with all our entries (newline included)
writeJson('address.json', sortAddresses(addr));
writeJson('all.json', allJson);

// add the specific alphabetical list
writeAllList(allJson.deny);

// find out what we don't have
const urls = meta.map(({ url }) => url);
const now = new Date();
const ym = `${now.getUTCFullYear()}-${`00${now.getUTCMonth() + 1}`.slice(-2)}`;
const ymd = `${ym}-${`00${now.getUTCDate()}`.slice(-2)}`;

// helper for parts
const urlParts = urls.map((u) => u.split('.'));

// rewrite with all our entries (newline included)
writeMeta(
  meta
    .concat(
      deny
        .filter((url) => {
          if (urls.includes(url)) {
            return false;
          }

          const len = url.split('.').length;

          return !urlParts.some((p) =>
            len < p.length &&
            url === p.slice(-len).join('.')
          );
        })
        .map((url) => ({ date: ymd, url }))
    )
    .filter(({ url }) =>
      deny.includes(url) ||
      isSubdomain(deny, url)
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
);
