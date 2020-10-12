# @polkadot/phishing

```js
import retrieveCheckDeny from '@polkadot/phishing';

const isOnDeny = await retrieveCheckDeny(window.location.host);

console.log(`isOnDeny=${isOnDeny}`);
```
