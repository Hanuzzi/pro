// This file should be placed in: /netlify/functions/simplify-word.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const wordToDefine = body.word;

    if (!wordToDefine || wordToDefine.trim() === '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please provide a word to simplify." })
      };
    }

    const prompt = `Explain the word "${wordToDefine}" in very simple terms for someone whose third language is English. Provide a short, easy-to-understand definition.`;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    if (!apiKey) {
      console.error("CRITICAL ERROR: Google AI API key is missing from environment variables.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error: API key not found." })
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.error("Error from Google AI API:", responseBody);
      return {
        statusCode: response.status,
        body: responseBody
      };
    }

    const result = JSON.parse(responseBody);
    const definition = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (definition) {
      return {
        statusCode: 200,
        body: JSON.stringify({ definition: definition })
      };
    } else {
      console.error("Could not parse definition from Google AI response:", JSON.stringify(result));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse the definition from the API response." })
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
