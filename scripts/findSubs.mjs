// Copyright 2020-2023 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';

/** @typedef {{ allow: string[]; deny: string[]; }} AllList */

// muli-part domain codes and (hopefully) valid top-levels (all manual from list)
const DOMS = [
  // county stuff
  'co.uk', 'com.ru', 'com.se', 'com.co', 'com.cn', 'com.es', 'com.ph', 'com.ua', 'com.ar', 'com.br', 'net.ph', 'org.ua', 'co.in', 'co.za', 'cn.com', 'com.pl', 'de.com', 'eu.com', 'gr.com', 'sa.com', 'us.com', 'uk.com', 'za.com', 'org.in', 'org.ph', 'com.au', 'com.my', 'com.in', 'com.mx', 'co.zw', 'com.vn', 'net.cn', 'org.cn', 'co.ke', 'co.id', 'com.ng', 'in.net', 'co.com', 'co.vu', 'us.org', 'org.ng',
  // other hosting stuff
  'ns01.us', 'ns02.us', 'kiev.ua', 'dns2.us', '000webhostapp.com', 'my.id', 'ipq.co', 'ngrok.io', 'tmweb.ru', 'firebaseapp.com', 'repl.co', 'blogspot.com', 'rf.gd', 'myftp.biz', '4nmn.com', 'azurewebsites.net', 'pythonanywhere.com', 'redirectme.net', 'yolasite.com', 'diskstation.org', 'servequake.com', 'serveirc.com', 'serveftp.com', 'cloudns.ph', 'epizy.com', 'dd-dns.de', 'dray-dns.de', 'pantheonsite.io', 'bitbucket.io'
];

// medium-like items
const MEDS = DOMS.map((d) => `medium.${d}`);

// get allow/deny lists
/** @type {AllList} */
const all = JSON.parse(fs.readFileSync('all.json', 'utf-8'));

// break the allow list into usable parts
const allow = all
  .allow
  .concat(...DOMS, ...MEDS)
  .map((a) => [a, a.split('.')]);

// filter deny to find items that could possibly be shortened
const filtered = all
  .deny
  .map((d) =>
    // first convert the domain to parts
    d.split('.')
  )
  .filter((d) =>
    // anything where we have more than 3 parts to the domain
    (d.length > 2) &&
    // no ip addresses
    (
      d.length !== 4 ||
      d.some((v) =>
        parseInt(v, 10).toString() !== v
      )
    ) &&
    // anything where there is more than a sub-domain from a top-level (or no top-level)
    !allow.some(([a, p]) =>
      (d.length > p.length) &&
      (d.slice(-p.length).join('.') === a)
    ) &&
    // no xn--
    !d.some((p) =>
      p.startsWith('xn--')
    )
  )
  .map((d) =>
    // reverse before sort (we re-reverse before we join)
    d.reverse()
  )
  .sort((a, b) =>
    // sort from the back (related sub-domains close together in the list)
    a.join('.').localeCompare(b.join('.'))
  )
  .map((d) =>
    // convert back to to a domain (aka re-reverse before printing)
    d.reverse().join('.')
  );

console.log(JSON.stringify(filtered, null, 2));
console.log(filtered.length);
