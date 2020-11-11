# @polkadot/phishing

```js
import { checkIfDenied } from '@polkadot/phishing';

const isOnDeny = await checkIfDenied(window.location.host);

console.log(`isOnDeny=${isOnDeny}`);
```
