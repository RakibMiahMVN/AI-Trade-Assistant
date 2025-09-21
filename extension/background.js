// Background script for AI Trade Assistant
console.log("AI Trade Assistant background script loaded");

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    translateText(request.text, request.from, request.to)
      .then((translation) => {
        sendResponse({ translation });
      })
      .catch((error) => {
        console.error("Translation error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "suggest") {
    generateSuggestions(request.sellerMessage)
      .then((suggestions) => {
        sendResponse({ suggestions });
      })
      .catch((error) => {
        console.error("Suggestion error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "generate_smart_suggestion") {
    generateSmartSuggestions(request.messages, request.intention)
      .then((suggestions) => {
        sendResponse({ suggestions });
      })
      .catch((error) => {
        console.error("Smart suggestion error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "analyze_intention") {
    analyzeSellerIntention(request.messages)
      .then((analysis) => {
        sendResponse({ analysis });
      })
      .catch((error) => {
        console.error("Intention analysis error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "translate_banglish_to_chinese") {
    translateBanglishToChinese(request.text)
      .then((translation) => {
        sendResponse({ translation });
      })
      .catch((error) => {
        console.error("Banglish translation error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Translate text using Google Translate unofficial API
async function translateText(text, from, to) {
  try {
    // Map language codes to Google Translate format
    const langMap = {
      zh: "zh-CN",
      bn: "bn",
      en: "en",
    };

    const sourceLang = langMap[from] || from;
    const targetLang = langMap[to] || to;

    // Translate using Google Translate API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();

    // Extract translated text from the response
    const translatedText = json[0].map((chunk) => chunk[0]).join("");

    return translatedText;
  } catch (error) {
    console.error("Google Translate API error:", error);
    // Fallback to MyMemory API
    console.log("Falling back to MyMemory API...");
    return fallbackTranslate(text, from, to);
  }
}

// Extract translation from Google Translate HTML response (deprecated)
function extractTranslationFromHTML(html) {
  // This function is no longer used since we switched to the official Google Translate API
  return null;
}

// Fallback translation using MyMemory API
async function fallbackTranslate(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${from}|${to}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      throw new Error("Translation failed");
    }
  } catch (error) {
    console.error("MyMemory API fallback error:", error);
    // Return original text if all translation methods fail
    return text;
  }
}

// Generate AI suggestions
async function generateSuggestions(sellerMessage) {
  // Get API key and model from Chrome storage (secure)
  const result = await chrome.storage.sync.get(["groqApiKey", "groqModel"]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama3-8b-8192"; // Default Groq model

  if (!API_KEY) {
    console.log("Groq API key not set. Please configure in extension popup.");
    return ["Please set your Groq API key in the extension settings."];
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant providing response suggestions for a chat conversation. Generate 3 helpful, concise reply suggestions in English that the user could send to continue the conversation.",
          },
          {
            role: "user",
            content: `Based on this seller message, suggest 3 helpful responses: "${sellerMessage}"`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();

    // Process Groq response (OpenAI-compatible format)
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the response to extract individual suggestions
    const suggestions = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+\./)) // Remove numbered prefixes
      .filter((line) => line.length > 10) // Filter out very short suggestions
      .slice(0, 3); // Take up to 3 suggestions

    // If parsing didn't work well, try to extract suggestions differently
    if (suggestions.length === 0) {
      // Fallback: split by common separators and clean up
      const fallbackSuggestions = content
        .split(/[•\-\*\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10 && s.length < 100)
        .slice(0, 3);

      return fallbackSuggestions.length > 0
        ? fallbackSuggestions
        : [
            "Thank you for your message!",
            "I understand. Can you provide more details?",
            "That sounds good. Let's proceed.",
          ];
    }

    return suggestions;
  } catch (error) {
    console.error("Groq API error:", error);
    // Fallback suggestions
    return [
      "Thank you for your message!",
      "I understand. Can you provide more details?",
      "That sounds good. Let's proceed.",
    ];
  }
}

// Generate smart suggestions based on conversation history and buyer intention
async function generateSmartSuggestions(messages, intention) {
  // Get API key, model, and buyer language from Chrome storage
  const result = await chrome.storage.sync.get([
    "groqApiKey",
    "groqModel",
    "buyerLanguage",
  ]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama-3.1-8b-instant"; // Use a more reliable model
  const buyerLanguage = result.buyerLanguage || "en";

  if (!API_KEY || API_KEY.trim() === "") {
    console.log("Groq API key not set. Please configure in extension popup.");
    const errorMsg =
      buyerLanguage === "bn"
        ? "অনুগ্রহ করে আপনার Groq API কী সেট করুন"
        : "Please set your Groq API key";
    const errorMsg2 =
      buyerLanguage === "bn"
        ? "অনুগ্রহ করে এক্সটেনশন সেটিংসে API কী কনফিগার করুন"
        : "Please configure API key in extension settings";
    return [
      {
        chinese: "请设置您的 Groq API 密钥",
        [buyerLanguage]: errorMsg,
      },
      {
        chinese: "请在扩展设置中配置 API 密钥",
        [buyerLanguage]: errorMsg2,
      },
    ];
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  // Create intention-specific prompts
  const intentionPrompts = {
    get_better_price:
      "Focus on negotiating better prices, asking for discounts, or volume-based pricing. Be polite but firm.",
    request_samples:
      "Ask for free samples, specify quantities needed, and explain why samples would help make a decision.",
    negotiate_terms:
      "Discuss payment terms, delivery schedules, or other business terms. Look for flexible options.",
    ask_specifications:
      "Ask detailed questions about product specifications, quality standards, or technical details.",
    request_moq:
      "Negotiate lower minimum order quantities or discuss small trial orders.",
    other:
      "Provide a helpful, context-aware response based on the conversation.",
  };

  const intentionPrompt = intentionPrompts[intention] || intentionPrompts.other;

  // Format conversation history
  let conversationContext = "";
  if (messages && messages.length > 0) {
    conversationContext =
      "\n\nRecent conversation:\n" +
      messages
        .map(
          (msg) => `${msg.type === "seller" ? "Seller" : "Buyer"}: ${msg.text}`
        )
        .join("\n");
  }

  try {
    // Validate request parameters
    if (!MODEL || !API_KEY) {
      throw new Error("Missing API key or model configuration");
    }

    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a skilled business negotiator helping a buyer communicate effectively with Chinese sellers on Alibaba. Your goal is to help the buyer achieve their objectives while maintaining polite, professional communication.

${intentionPrompt}

Provide exactly 2 strategic response suggestions in Chinese that would help the buyer achieve their goal. Each suggestion should be:
- Polite and professional
- Culturally appropriate for Chinese business communication
- Strategic in advancing the buyer's interests
- Concise but comprehensive

Return only the Chinese text for each suggestion, separated by newlines. No English explanations or additional formatting.`,
        },
        {
          role: "user",
          content: `Based on this conversation context, suggest 2 strategic responses in Chinese that would help achieve: ${intention.replace(
            /_/g,
            " "
          )}${conversationContext}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    };

    console.log("Sending request to Groq API:", {
      model: MODEL,
      messagesCount: requestBody.messages.length,
    });

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Groq API Error Response:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Groq API Response:", data);

    // Validate response structure
    if (
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0
    ) {
      throw new Error("Invalid response structure from Groq API");
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in Groq API response");
    }

    console.log("AI Response content:", content);

    // Parse the response to extract Chinese suggestions
    const chineseSuggestions = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+\./))
      .filter((line) => line.length > 10)
      .slice(0, 2);

    // Generate bilingual suggestions
    const bilingualSuggestions = [];
    for (const chinese of chineseSuggestions) {
      try {
        // Always translate to English first
        const englishTranslation = await translateText(chinese, "zh", "en");

        // Then translate to buyer's language if different from English
        let buyerTranslation = englishTranslation;
        if (buyerLanguage !== "en") {
          buyerTranslation = await translateText(chinese, "zh", buyerLanguage);
        }

        const suggestion = {
          chinese: chinese,
          english: englishTranslation,
          [buyerLanguage]: buyerTranslation,
        };

        bilingualSuggestions.push(suggestion);
      } catch (error) {
        console.error("Translation error:", error);
        bilingualSuggestions.push({
          chinese: chinese,
          english: chinese, // Fallback to Chinese
          [buyerLanguage]: chinese, // Fallback to Chinese
        });
      }
    }

    // If we don't have enough suggestions, provide fallbacks
    if (bilingualSuggestions.length === 0) {
      const fallbacks = [
        {
          chinese: "您好，我想了解更多关于这个产品的信息。",
          english: "Hello, I want to know more about this product.",
          [buyerLanguage]:
            buyerLanguage === "bn"
              ? "হ্যালো, আমি এই পণ্য সম্পর্কে আরও তথ্য জানতে চাই।"
              : "Hello, I want to know more about this product.",
        },
        {
          chinese: "我们可以讨论一下价格吗？",
          english: "Can we discuss the price?",
          [buyerLanguage]:
            buyerLanguage === "bn"
              ? "আমরা দাম নিয়ে আলোচনা করতে পারি?"
              : "Can we discuss the price?",
        },
      ];
      return fallbacks.slice(0, 2);
    }

    return bilingualSuggestions;
  } catch (error) {
    console.error("Groq API error:", error);

    // Handle specific error types
    if (error.name === "AbortError") {
      console.error("Request timed out");
      const timeoutMsg1 =
        buyerLanguage === "bn"
          ? "অনুরোধের সময় শেষ হয়েছে, অনুগ্রহ করে পরে আবার চেষ্টা করুন"
          : "Request timed out, please try again later";
      const timeoutMsg2 =
        buyerLanguage === "bn"
          ? "নেটওয়ার্ক সংযোগ সমস্যা, অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করুন"
          : "Network connection issue, please check your connection";
      return [
        {
          chinese: "请求超时，请稍后重试",
          english: "Request timed out, please try again later",
          [buyerLanguage]: timeoutMsg1,
        },
        {
          chinese: "网络连接问题，请检查您的连接",
          english: "Network connection issue, please check your connection",
          [buyerLanguage]: timeoutMsg2,
        },
      ];
    }

    if (error.message.includes("400")) {
      console.error("Bad request - likely invalid API key or model");
      const apiErrorMsg1 =
        buyerLanguage === "bn"
          ? "API কনফিগারেশন ত্রুটি, অনুগ্রহ করে আপনার কী পরীক্ষা করুন"
          : "API configuration error, please check your key";
      const apiErrorMsg2 =
        buyerLanguage === "bn"
          ? "অনুগ্রহ করে এক্সটেনশন সেটিংসে API কী আপডেট করুন"
          : "Please update API key in extension settings";
      return [
        {
          chinese: "API 配置错误，请检查您的密钥",
          english: "API configuration error, please check your key",
          [buyerLanguage]: apiErrorMsg1,
        },
        {
          chinese: "请在扩展设置中更新 API 密钥",
          english: "Please update API key in extension settings",
          [buyerLanguage]: apiErrorMsg2,
        },
      ];
    }

    // Fallback suggestions for other errors
    const fallbackMsg1 =
      buyerLanguage === "bn"
        ? "হ্যালো, আমি এই পণ্য সম্পর্কে আরও তথ্য জানতে চাই।"
        : "Hello, I want to know more about this product.";
    const fallbackMsg2 =
      buyerLanguage === "bn"
        ? "আমরা দাম নিয়ে আলোচনা করতে পারি?"
        : "Can we discuss the price?";
    return [
      {
        chinese: "您好，我想了解更多关于这个产品的信息。",
        english: "Hello, I want to know more about this product.",
        [buyerLanguage]: fallbackMsg1,
      },
      {
        chinese: "我们可以讨论一下价格吗？",
        english: "Can we discuss the price?",
        [buyerLanguage]: fallbackMsg2,
      },
    ];
  }
}

// Analyze seller message intention using AI
async function analyzeSellerIntention(sellerMessages) {
  // Get API key, model, and buyer language from Chrome storage
  const result = await chrome.storage.sync.get([
    "groqApiKey",
    "groqModel",
    "buyerLanguage",
  ]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama-3.1-8b-instant";
  const buyerLanguage = result.buyerLanguage || "en";

  if (!API_KEY || API_KEY.trim() === "") {
    console.log("Groq API key not set. Please configure in extension popup.");
    return {
      tone: "Unable to analyze - API key not configured",
      firmness: "Unknown",
      moq_flexibility: "Unknown",
      key_points: ["Please set your Groq API key in the extension settings"],
    };
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  // Format the conversation context from multiple messages
  let conversationContext = "";
  if (Array.isArray(sellerMessages) && sellerMessages.length > 0) {
    if (sellerMessages.length === 1) {
      conversationContext = `Seller message: "${sellerMessages[0]}"`;
    } else {
      conversationContext =
        "Recent seller messages:\n" +
        sellerMessages.map((msg, index) => `${index + 1}. "${msg}"`).join("\n");
    }
  } else {
    // Fallback for single message or invalid input
    const singleMessage = Array.isArray(sellerMessages)
      ? sellerMessages[0]
      : sellerMessages;
    conversationContext = `Seller message: "${singleMessage}"`;
  }

  try {
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert business analyst specializing in Chinese e-commerce negotiations. Analyze the seller's message(s) and provide a structured analysis in JSON format.

Return ONLY a valid JSON object with this exact structure:
{
  "tone": "polite/professional/firm/aggressive/neutral",
  "firmness": "very flexible/flexible/moderate/firm/very firm",
  "moq_flexibility": "very flexible/flexible/standard/resistant/very resistant",
  "key_points": ["array of 2-4 key insights about the seller's position, pricing stance, or negotiation approach"]
}

Focus on:
- Tone: How polite/professional/firm the seller is across all messages
- Price firmness: How willing they are to negotiate price based on the conversation
- MOQ flexibility: How open they are to changing minimum order quantities
- Key points: Important insights about their business approach, consistency, or evolving position`,
        },
        {
          role: "user",
          content: `Analyze these seller messages and provide intention analysis: ${conversationContext}`,
        },
      ],
      max_tokens: 300, // Reduced since we're generating in English
      temperature: 0.3, // Lower temperature for more consistent analysis
    };

    console.log("Sending intention analysis request to Groq API");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Groq API Error Response:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Intention analysis response:", data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in Groq API response");
    }

    console.log("AI Analysis content:", content);

    // Parse the JSON response
    try {
      const analysis = JSON.parse(content.trim());
      return analysis;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Try to extract information from non-JSON response
      return extractAnalysisFromText(content); // Always extract in English
    }
  } catch (error) {
    console.error("Groq API error:", error);

    if (error.name === "AbortError") {
      console.error("Request timed out");
      return {
        tone: "Analysis timed out",
        firmness: "Unknown",
        moq_flexibility: "Unknown",
        key_points: ["Request timed out - please try again"],
      };
    }

    if (error.message.includes("400")) {
      console.error("Bad request - likely invalid API key or model");
      return {
        tone: "API configuration error",
        firmness: "Unknown",
        moq_flexibility: "Unknown",
        key_points: ["Please check your API key and model settings"],
      };
    }

    // Fallback analysis
    return {
      tone: "Unable to analyze",
      firmness: "Unknown",
      moq_flexibility: "Unknown",
      key_points: [
        "Analysis failed due to API error",
        "Please try again later",
      ],
    };
  }
}

// Extract analysis from text response if JSON parsing fails
function extractAnalysisFromText(text) {
  // Simple fallback parsing - always in English
  const analysis = {
    tone: "Neutral",
    firmness: "Moderate",
    moq_flexibility: "Standard",
    key_points: [],
  };

  // Try to extract key information
  if (text.toLowerCase().includes("firm")) {
    analysis.firmness = "Firm";
  } else if (text.toLowerCase().includes("flexible")) {
    analysis.firmness = "Flexible";
  }

  if (text.toLowerCase().includes("polite")) {
    analysis.tone = "Polite";
  } else if (text.toLowerCase().includes("professional")) {
    analysis.tone = "Professional";
  }

  analysis.key_points = [
    "Analysis completed with limited detail",
    "Consider the seller's overall communication style",
    "Look for specific pricing and MOQ mentions",
  ];

  return analysis;
}

// Translate Banglish to Chinese using AI
async function translateBanglishToChinese(banglishText) {
  // Get API key and model from Chrome storage
  const result = await chrome.storage.sync.get(["groqApiKey", "groqModel"]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama-3.1-8b-instant";

  if (!API_KEY || API_KEY.trim() === "") {
    console.log("Groq API key not set. Please configure in extension popup.");
    return "请设置您的 Groq API 密钥"; // Please set your Groq API key
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a specialized translator for Banglish (Bengali written in English script) to Chinese. Your task is to:

1. Understand Banglish text (Bengali words transliterated into English letters)
2. Convert the meaning to proper Chinese
3. Return ONLY the Chinese translation, nothing else

Common Banglish patterns:
- "ami" = I/me
- "tumi" = you
- "khabar" = food/eat
- "chai" = want
- "valo" = good/better
- "aro" = more
- "onek" = many/very
- "shona" = beautiful
- "bhalo" = good
- "kharap" = bad
- "kichu" = something
- "shob" = all/everything

Examples:
- "ami chai" → "我要" (I want)
- "aro valo chai" → "想要更好的" (want better)
- "onek bhalo" → "非常好" (very good)

Translate naturally and contextually appropriate for business communication.`,
        },
        {
          role: "user",
          content: `Translate this Banglish to Chinese: "${banglishText}"`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    };

    console.log("Sending Banglish translation request to Groq API");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Groq API Error Response:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Banglish translation response:", data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in Groq API response");
    }

    console.log("Banglish translation result:", content.trim());

    // Clean up the response (remove any extra text, quotes, etc.)
    return content.trim().replace(/^["']|["']$/g, '');

  } catch (error) {
    console.error("Banglish translation error:", error);

    if (error.name === "AbortError") {
      console.error("Banglish translation request timed out");
      return "翻译超时，请重试"; // Translation timed out, please try again
    }

    if (error.message.includes("400")) {
      console.error("Bad request - likely invalid API key or model");
      return "API 配置错误"; // API configuration error
    }

    // Fallback: return a generic message
    return "翻译失败，请重试"; // Translation failed, please try again
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("1688 Chat Translator extension installed");
});
