require('dotenv').config();
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

const {
    TRANSFERWISE_API_TOKEN,
    TRANSFERWISE_PROFILE_ID,
    TRANSFERWISE_BORDERLESS_ACCOUNT_ID,
    FREEAGENT_CLIENT_ID,
    FREEAGENT_CLIENT_SECRET,
    FREEAGENT_REFRESH_TOKEN,
    FREEAGENT_BANK_ACCOUNT_ID,
} = process.env;

go().catch(error => {
    console.error(error);
});

async function go() {

    const accessToken = (await (await fetch(`https://api.freeagent.com/v2/token_endpoint`, {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${FREEAGENT_CLIENT_ID}:${FREEAGENT_CLIENT_SECRET}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(FREEAGENT_REFRESH_TOKEN)}`,
    })).json()).access_token;

    const res0 = await fetch(`https://api.freeagent.com/v2/bank_accounts/${FREEAGENT_BANK_ACCOUNT_ID}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        }
    });

    const acc = await res0.json();
    let start = `${acc.bank_account.latest_activity_date}T00:00:00.000Z`;
    let currency = acc.bank_account.currency;

    let signature;
    let ott;
    let res1;
    for (let i = 0; i <= 1; i++) {
        const headers = {
            "Authorization": `Bearer ${TRANSFERWISE_API_TOKEN}`,
        };

        if (signature && ott) {
            headers["X-Signature"] = signature;
            headers["X-2FA-Approval"] = ott;
        }

        res1 = await fetch(`https://api.transferwise.com/v3/profiles/${TRANSFERWISE_PROFILE_ID}/borderless-accounts/${TRANSFERWISE_BORDERLESS_ACCOUNT_ID}/statement.json?currency=${currency}&intervalStart=${start}&intervalEnd=${new Date().toISOString()}`, {
            headers,
        });

        if (res1.status === 403 && res1.headers.get("X-2FA-Approval-Result") === "REJECTED") {
            const sign = crypto.createSign("RSA-SHA256");
            sign.update(res1.headers.get("X-2FA-Approval"));
            signature = sign.sign(fs.readFileSync("private.pem")).toString("base64");
            ott = res1.headers.get("X-2FA-Approval");
        }
    }

    if (!res1.ok) {
        console.log("Failed getting statement from TransferWise");
        return;
    }

    const txns1 = await res1.json();

    let txns = txns1.transactions.map(txn => ({
        dated_on: txn.date.substr(0, 10),
        description: txn.details.type === "DEPOSIT" ? `${txn.details.paymentReference} from ${txn.details.senderName}` : txn.details.type === "TRANSFER" ? `To ${txn.details.recipient.name} ref ${txn.details.paymentReference}` : `${txn.details.description}`,
        amount: txn.amount.value,
    }));

    const res2 = await fetch(`https://api.freeagent.com/v2/bank_transactions/statement?bank_account=${FREEAGENT_BANK_ACCOUNT_ID}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ statement: txns }),
    });

    if (res2.ok) {
        console.log("Yep");
    } else {
        console.log("Nope - ", await res2.json());
    }
}
