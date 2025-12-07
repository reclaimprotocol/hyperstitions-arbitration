# Hyperstitions Arbitration

This oracle can be used permissionlessly to settle markets on Prediction Markets.

For every prediction market, you can create an arbitration. This arbitration takes two inputs - an API and a Prompt. 

First, the API request is made and the response from the API call is passed along with the prompt to an AI LLM.

You will always have the guarantee that the API call was correctly made, and that the correct AI model with the correct prompt and API response was used to generate a response.

Tweak the prompt such that it settles the said prediction market.

That's it :)

This product is hosted at https://arbitration.reclaimprotocol.org

## Self hosting
Clone :
```
$ git pull git@github.com:reclaimprotocol/hyperstitions-arbitration.git
```

Install deps :
```
$ npm install
```

Set .env
```
# .env.local
RECLAIMPROTOCOL_APP_ID=0x...
RECLAIMPROTOCOL_APP_SECRET=0x...
CLAUDE_API_KEY=sk-...
```

You can get the Reclaim Protocol keys using dev.reclaimprotocol.org

Be sure to toggle on [zkFetch](https://docs.reclaimprotocol.org/zkfetch) for the application on the Reclaim Protocol Dev Tool
