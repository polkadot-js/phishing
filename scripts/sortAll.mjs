// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

function sortSection (values) {
  return values.sort((a, b) => a.localeCompare(b));
}

const original = JSON.parse(fs.readFileSync('all.json', 'utf-8'));
const allow = sortSection(original.allow);
const deny = sortSection(original.deny);

fs.writeFileSync('all.json', JSON.stringify({ allow, deny }, null, 2));
