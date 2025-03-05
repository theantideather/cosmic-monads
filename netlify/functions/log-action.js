exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { playerId, action } = data;
    
    if (!playerId || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }
    
    // In a real implementation, this would actually log to the blockchain
    // For demo purposes, we're just returning a success response
    console.log(`[MOCK] Action logged: ${playerId}:${action}`);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        success: true,
        message: "Action logged successfully",
        txHash: `mock-tx-${Date.now().toString(16)}`,
        playerId,
        action
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error", message: error.message })
    };
  }
}; 