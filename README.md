# Vanilla XCP

Vanilla XCP is a minimalistic Bitcoin and Counterparty wallet.

It's written in JavaScript and HTML5. It can run in any browser, on any operating system, and on phones, tablets, as well as on desktops.

It's intended as a starting point for developers to build new, custom wallets. It can also be used as is.

The wallet can be run locally (download zip, extract, open `index.html` in browser) or served from a website. In either case the keys never leave the browser and are decrypted only when signing transactions.

First time users will be given a 12-word passphrase and a suggested password. These can be changed by the user, e.g. to an existing Counterwallet passphrase.

The wallet will be permanently encrypted and stored in the browser's local storage. It's possible instead to save the encrypted passphrase and address as variables in `index.html`.

Asset balances are shown along with the USD equivalent if the asset is listed on coinmarketcap.com. 

The send form has basic sanity checks built in. Subassets are supported.

Test out the wallet here : http://jpja.net/xcp/vanilla-xcp/

## Donate

To support continued development, please consider a small tip to `1AeEhRpChp1TteqBTkC4GPmyQJgH31MMmK`.

## Suggested Use Cases

* Card Collector Wallet. A project with its own cards can make the wallet display these only. Cards the user currently owns can be shown first and in color, while cards not yet collected are in gray.

* Integrated Website Token Platform. Users can have a wallet created in the background. Users who've earned enough points get a token sent to them. Since very low values are at risk, no password needed and no need to backup a passphrase.

* Customized Project Wallet. Add your design and make it your own project's custom wallet. Host it on your web server for new (and low-value) users, and inform users that for added safety they can download it and run it locally.

## Warnings

The wallet is pending peer review. For real value transactions it is better to use a more thourougly tested wallet.

The wallet depends on public APIs. These may be unstable or eventually be discontinued - in which case the wallet will no longer work.

Vanilla XCP is released to the public domain with no support or warranties whatsoever. Use at own risk!