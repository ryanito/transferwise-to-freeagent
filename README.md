# Installation

1. Make sure you have `node` and `npm` installed
2. `npm install`
3. Copy `.env.example` to `.env` and populate each value. 
4. Generate a public-private key pair:

```
openssl genrsa -out private.pem 2048
openssl rsa -pubout -in private.pem -out public.pem
```

Keep `private.pem` in the root directory of the app, and upload `public.pem` to your TransferWise account (Settings -> API Tokens -> Manage public keys)

FreeAgent does not fully support multi-currency bank accounts (at the time of writing), so they recommend that you add a separate bank account for each currency that you hold (see "A word on PayPal" at https://www.freeagent.com/blog/multi-currency-banking-arrives/)

You can specify multiple FreeAgent bank accounts as a comma-separated string in `.env`, e.g. `FREEAGENT_BANK_ACCOUNT_ID="123,456"`. The script will loop through these accounts and import transactions from TransferWise that match the bank account's currency.

# Usage

`node index.js`

It'll output a simple "Yep". Go to your FreeAgent account and the transactions since your last upload will be in the bank account, ready to be explained/confirmed.
