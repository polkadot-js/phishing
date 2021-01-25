## @polkadot/phishing

A curated list of known less-than-honest sites inclusive of a simple JS utility function to check any host against this list.


### Additions

To add a new site, edit [all.json](https://github.com/polkadot-js/phishing/edit/master/all.json) and add any new entries, single or multiples is allowed per edit.

To add a new scam address (typically per site), edit [address.json](https://github.com/polkadot-js/phishing/edit/master/address.json) and add it in the correct section (which is keyed by the site providing them).


### Availability

Making additions to the list will be reflected on merge at [polkadot.js.org/phishing/all.json](https://polkadot.js.org/phishing/all.json) &  [polkadot.js.org/phishing/address.json](https://polkadot.js.org/phishing/address.json). These can be consumed via [@polkadot/phishing](https://github.com/polkadot-js/phishing/tree/master/packages/phishing) and other tools capable of parsing JSON.


### Integration

Since the lists are published as JSON, any non-JS wallets (only a JS library that is provided), integrartion should be simple - retrieve the list, parse the JSON and do the required checks. The Javascript library does have some features that may be worth thinking about for other integrations -

- instead of retrieving the list each time a request is made, a local copy is cached for 45 mins and then re-retrieved when the timer expires (as a request is made)
- for address checks the check is done on the decoded ss58 address to ensure that network-jumps with the same keys are avoided (so addresses does not have to be re-added for other networks, a single entry will cover all)


### Contributing

This lists are intended to be maintained with active input from the community, so contributions are welcome, either via a pull request (edit above as described in additions) or by [logging an issue](https://github.com/polkadot-js/phishing/issues).
