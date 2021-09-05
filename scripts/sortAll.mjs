// Copyright 2020-2021 @polkadot/phishing authors & contributors
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

function addSites (deny, values) {
  return Object
    .keys(values)
    .reduce((filtered, url) => {
      !filtered.includes(url) && !KNOWN_URLS.includes(url) &&
        filtered.push(url);

      return filtered;
    }, deny);
}

function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson (file, contents) {
  fs.writeFileSync(file, `${JSON.stringify(contents, null, 2)}\n`);
}

const addr = readJson('address.json');
const all = readJson('all.json');
const meta = readJson('urlmeta.json');
const deny = sortSection(addSites(all.deny, addr));

// rewrite with all our entries (newline included)
writeJson('address.json', sortAddresses(addr));
writeJson('all.json', { allow: sortSection(all.allow), deny });

// find out what we don't have
const urls = meta.map(({ url }) => url);
const now = new Date();
const date = `${now.getUTCFullYear()}-${`00${now.getUTCMonth() + 1}`.slice(-2)}-${`00${now.getUTCDate()}`.slice(-2)}`;

// rewrite with all our entries (newline included)
writeJson('urlmeta.json',
  meta
    .concat(
      deny
        .filter((url) => !urls.includes(url))
        .map((url) => ({ date, url }))
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
);
