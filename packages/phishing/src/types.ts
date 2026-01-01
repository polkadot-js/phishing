// Copyright 2020-2026 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface HostList {
  allow: string[];
  deny: string[];
}

export type AddressList = Record<string, string[]>;
