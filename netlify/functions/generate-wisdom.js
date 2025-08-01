// This file should be placed in: /netlify/functions/generate-wisdom.js

exports.handler = async function(event, context) {
  const prompt = "Generate a short, actionable 'success nugget' (2-3 sentences) for an aspiring billionaire. The tone should be direct and motivating, focusing on principles of wealth creation, extreme discipline, or strategic thinking. Style of Naval Ravikant or Morgan Housel.";

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }]
  };

  // Your API key is securely accessed from Netlify's environment variables.
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  // --- DIAGNOSTIC STEP ---
  // First, check if the API key was found in the Netlify environment.
  if (!apiKey) {
    console.error("CRITICAL ERROR: Google AI API key is missing from environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: The GOOGLE_AI_API_KEY was not found. Please ensure it is set correctly in your Netlify site settings and that the site has been redeployed." })
    };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error from Google AI API:", errorBody);
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: `The API call failed with status: ${response.status}. Please check the Netlify function log for details from the Google AI API.` })
        };
    }

    const result = await response.json();
    
    // Safely access the nested property to prevent crashes
    const wisdomText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (wisdomText) {
        return {
          statusCode: 200,
          body: JSON.stringify({ wisdom: wisdomText })
        };
    } else {
        console.error("Could not find wisdom text in Google AI response:", JSON.stringify(result));
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to parse wisdom from the API response." })
        };
    }

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal server error occurred in the function." })
    };
  }
};
