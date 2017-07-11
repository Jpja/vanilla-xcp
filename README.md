# Vanilla XCP

Vanilla XCP is a minimalistic Bitcoin and Counterparty wallet.

It's written in JavaScript and HTML5. It can run in any browser on any operating system, and on phones, tablets, as well as on desktops.

The wallet can be run locally (download zip, extract, open `index.html` in browser) or served from a website. In either case the keys never leave the browser and are decrypted only when signing transactions.

First time users will be given a 12-word passphrase and suggested a password. These can be changed by the user, e.g. to an existing Counterwallet passphrase.

The wallet will be permanently encrypted and stored in the browser's local storage. It's possible instead to save the encrypted passphrase and address as variables in `index.html`.

Asset balances are shown along with the USD equivialent if the asset is listed on coinmarketcap.com. 

The send form has basic sanity checks built in. Subassets are supported.

## Donate

To support continued development, please consider a small tip to `1AeEhRpChp1TteqBTkC4GPmyQJgH31MMmK`.

## Warnings

The wallet is pending peer review. For real value transactions it is better to use a more thourougly tested wallet.

The wallet depends on public APIs. These may be unstable or eventually be discontinued - in which case the wallet will no longer work.

Vanilla XCP is released to the public domain with no support or warranites whatsoever. Use at own risk!

## Suggested Use Cases


