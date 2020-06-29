# Installation

1. Make sure you have `node` and `npm` installed
2. `npm install`
3. Copy `.env.example` to `.env` and populate each value
4. Generate a public-private key pair:

```
openssl genrsa -out private.pem 2048
openssl rsa -pubout -in private.pem -out public.pem
```

Keep `private.pem` in the root directory of the app, and upload `public.pem` to your TransferWise account (Settings -> API Tokens -> Manage public keys)

# Usage

`node index.js [start_date]`

Where [start_date] is in YYYYMMDD format, e.g. 20190120 for January 20, 2019.

It'll output a simple "Yep". Go to your FreeAgent account and the transactions will be in the bank account, ready to be explained/confirmed.
