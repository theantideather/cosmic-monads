const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x37Ea645D9CA096ecAAbf23c9Ed1b589f68198957";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a";

exports.handler = async function(event, context) {
  // Return mock status data since this is just a demo function
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify({
      connected: true,
      wallet: WALLET_ADDRESS,
      contractAddress: CONTRACT_ADDRESS,
      transactionCount: 0,
      queueLength: 0,
      maxTransactionsPerMinute: 10,
      throttleInterval: 5000
    })
  };
}; 