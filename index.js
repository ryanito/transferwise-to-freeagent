require('dotenv').config();
const fetch = require('node-fetch');

const {
    TRANSFERWISE_API_TOKEN,
    TRANSFERWISE_BORDERLESS_ACCOUNT_ID,
    FREEAGENT_CLIENT_ID,
    FREEAGENT_CLIENT_SECRET,
    FREEAGENT_REFRESH_TOKEN,
    FREEAGENT_BANK_ACCOUNT_ID,
} = process.env;

const dateString = process.argv[2];

if (!dateString || !/^20\d{6}$/.test(dateString)) {
  console.error("Need a start date e.g. 20190101");
  process.exit(1);
}

go(`${dateString.substr(0, 4)}-${dateString.substr(4, 2)}-${dateString.substr(6, 2)}T00:00:00.000Z`)
    .catch(error => {
        console.error(error);
    });

async function go(start) {
    const txns1 = await (await fetch(`https://api.transferwise.com/v1/borderless-accounts/${TRANSFERWISE_BORDERLESS_ACCOUNT_ID}/statement.json?currency=USD&intervalStart=${start}&intervalEnd=${new Date().toISOString()}`, {
        headers: {
            "Authorization": `Bearer ${TRANSFERWISE_API_TOKEN}`,
        },
    })).json();

    txns = txns1.transactions.map(txn => ({
        dated_on: txn.date.substr(0, 10),
        description: txn.details.type === "DEPOSIT" ? `${txn.details.paymentReference} from ${txn.details.senderName}` : txn.details.type === "TRANSFER" ? `To ${txn.details.recipient.name} ref ${txn.details.paymentReference}` : `${txn.details.description}`,
        amount: txn.amount.value,
    }));

    const accessToken = (await (await fetch(`https://api.freeagent.com/v2/token_endpoint`, {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${FREEAGENT_CLIENT_ID}:${FREEAGENT_CLIENT_SECRET}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(FREEAGENT_REFRESH_TOKEN)}`,
    })).json()).access_token;

    const response = await fetch(`https://api.freeagent.com/v2/bank_transactions/statement?bank_account=${FREEAGENT_BANK_ACCOUNT_ID}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ statement: txns }),
    });

    if (response.status === 200) {
        console.log("Yep");
    } else {
        console.log("Nope - ", await response.json());
    }
}
