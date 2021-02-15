# CHANGELOG

## 0.5.1 Feb 15, 2021

Contributed:

- Added polkadot-event.com, polkadot-support.com, polkadot-js.online, claimpolka.live (Thanks to https://github.com/laboon)
- Added polkadots.live (Thanks to https://github.com/SimonKraus)
- Added polkadotairdrop.com (Thanks to https://github.com/NukeManDan)
- Added polkadot-get.com, polkadot-promo.info (Thanks to https://github.com/BraveSam)
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
