# CHANGELOG

## 0.18.6 Aug 21, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 10.1.5


## 0.18.5 Aug 13, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 10.1.4


## 0.18.4 Aug 7, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 10.1.3


## 0.18.2 Jul 30, 2022

Contributed:

- Too many URLs to mention

Changes:

- Collapse top-level domains
- Update to `@polkadot/util` 10.1.2


## 0.18.1 Jul 21, 2022

Contributed:

- Too many URLs to mention

Changes:

- Move allow list to `all.json`
- Adjust wildcard check for top-level domains
- Update to `@polkadot/util` 10.1.1


## 0.17.2 Jul 10, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 10.0.2


## 0.17.1 Jul 8, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util-crypto` 10.0.1


## 0.16.2 Jul 4, 2022

Changes:

- Update to `@polkadot/util-crypto` 9.7.2


## 0.16.1 Jul 1, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 9.7.1


## 0.15.2 Jun 25, 2022

Changes:

- Update to `@polkadot/util` 9.6.2


## 0.15.1 Jun 23, 2022

Contributed:

- Too many URLs to mention

Changes:

- Don't publish to npm on each commit
- Update to `@polkadot/util` 9.6.1


## 0.14.1 Jun 19, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 9.5.1


## 0.13.1 May 14, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 9.2.1


## 0.12.1 Apr 30, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 9.1.1


## 0.11.1 Apr 9, 2022

Contributed:

- Too many URLs to mention

Changes:

- Output commonjs files under the `cjs/**` root
- Update to `@polkadot/util` 9.0.1


## 0.10.1 Mar 19, 2022

Contributed:

- Too many URLs to mention

Changes:

- Additional workaround for Vite bundling
- Update to `@polkadot/util` 8.6.1


## 0.9.1 Mar 12, 2022

Contributed:

- Too many URLs to mention

Changes:

- Adjust for bundlers where `import.meta.url` is undefined
- Update to `@polkadot/util` 8.5.1


## 0.8.1 Jan 9, 2022

Contributed:

- Too many URLs to mention

Changes:

- Update to `@polkadot/util` 8.3.1


## 0.7.1 Dec 31, 2021

Contributed:

- Too many URLs to mention

Changes:

- Add `detectPackage` to check for duplicate instances
- Adjust consistency tests
- Split metadata into months


## 0.6.1 Feb 28, 2021

Contributed:

- Added polkadot-bonus.network (Thanks to https://github.com/FlorianFranzen)
- Added polkadgiveaway.com (Thanks to https://github.com/SimonKraus)
- Added polkadotbridge.org, dot-event.org, dot-event.news (Thanks to https://github.com/NukeManDan)
- Added wallet-validation.site, kusama-wallet.com, atomicwalletgift.live (Thanks to https://github.com/laboon)
- Added polkadot-airdrop.online, polkadot-airdrops.net, polkadot.wallet-linker.net, web-polkadot.web.app (Thanks to https://github.com/nymetva)
- Add scam addresses from victims (Thanks to https://github.com/michalisFr)

Changes:

- Align tests with all new sites as added
- Adjust visual display for active status (via cors proxy)
- Add current balances to account display
- Group accounts based on network they belong to
- Added polkadotlive.com, polkadotsnetwork.com, polkabeam.org, polkadot-js.site (as reported)


## 0.5.1 Feb 15, 2021

Contributed:

- Added polkadot-event.com, polkadot-support.com, polkadot-js.online, claimpolka.live (Thanks to https://github.com/laboon)
- Added polkadots.live (Thanks to https://github.com/SimonKraus)
- Added polkadotairdrop.com (Thanks to https://github.com/NukeManDan)
- Added polkadot-get.com, polkadot-promo.info (Thanks to https://github.com/BraveSam)
- Add known historic phishing addresses (Thanks to https://github.com/jackesky)
- Added non-threat simpleswap.io to known checks https://github.com/dud1337)

Changes:

- JSON files & index page published to IPNS, https://ipfs.io/ipns/phishing.dotapps.io
- Add list of known phishing addresses under `address.json`
- Add a CI check against known sites for addresses (as changed)
- Add known phishing addresses not via sites (e.g. Youtube scam links)


## 0.4.1 Jan 24, 2021

Contributed:

- Added polkadot-wallet.com (Thanks to https://github.com/FlorianFranzen)
- Added 4dot.net, polkadots.network, polkadotwallet-unlock.org (Thanks to https://github.com/FlorianFranzen)
- Added polkadotunlockwallet.com, polkadot.company (Thanks to https://github.com/FlorianFranzen)
- Added dot4.org, getpolkadot.net (Thanks to https://github.com/FlorianFranzen)
- Added dotevent.org, polkadot.center, polkadotlive.network (Thanks to https://github.com/FlorianFranzen)
- Added polkadot.express (Thanks to https://github.com/laboon)
- Added polkadot-airdrop.org, polkadot-live.online, walletsynchronization.com (Thanks to https://github.com/jackesky)

Changes:

- Add `checkAddress` function to check addresses
- Add test for sites with www prefix
- Sort sites as part of the pre-publish build
- Add duplicate check on CI
- Add address.json for list of known addresses
- Add urlmeta.json for extended info
- Add index.html for table display from meta
- Added polkadot-airdrop.live
- Added polkadotfund.com


## 0.3.1 Dec 13, 2020

Contributed:

- Added polkadot.com.se (Thanks to https://github.com/gdixon)

Changes:

- Publish as dual cjs/esm modules
- Allow for list caching, while maintaining freshness


## 0.2.1 Nov 11, 2020

Changes:

- Remove default export on package


## 0.1.1 Sep 21, 2020

Changes:

- Initial release
