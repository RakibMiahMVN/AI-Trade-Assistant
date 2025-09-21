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

  if (request.action === "summarize_conversation") {
    summarizeConversation(request.messages, request.summaryType, request.summaryValue)
      .then((summary) => {
        sendResponse({ summary });
      })
      .catch((error) => {
        console.error("Summarization error:", error);
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
  // Get API key and model from Chrome storage
  const result = await chrome.storage.sync.get(["groqApiKey", "groqModel"]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama-3.1-8b-instant"; // Use a more reliable model

  if (!API_KEY || API_KEY.trim() === "") {
    console.log("Groq API key not set. Please configure in extension popup.");
    return [
      {
        chinese: "请设置您的 Groq API 密钥",
        bengali: "অনুগ্রহ করে আপনার Groq API কী সেট করুন",
      },
      {
        chinese: "请在扩展设置中配置 API 密钥",
        bengali: "অনুগ্রহ করে এক্সটেনশন সেটিংসে API কী কনফিগার করুন",
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
        // Translate to Bengali
        const bengaliTranslation = await translateText(chinese, "zh", "bn");
        bilingualSuggestions.push({
          chinese: chinese,
          bengali: bengaliTranslation || chinese,
        });
      } catch (error) {
        console.error("Translation error:", error);
        bilingualSuggestions.push({
          chinese: chinese,
          bengali: chinese, // Fallback to Chinese if translation fails
        });
      }
    }

    // If we don't have enough suggestions, provide fallbacks
    if (bilingualSuggestions.length === 0) {
      const fallbacks = [
        {
          chinese: "您好，我想了解更多关于这个产品的信息。",
          bengali: "হ্যালো, আমি এই পণ্য সম্পর্কে আরও তথ্য জানতে চাই।",
        },
        {
          chinese: "我们可以讨论一下价格吗？",
          bengali: "আমরা দাম নিয়ে আলোচনা করতে পারি?",
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
      return [
        {
          chinese: "请求超时，请稍后重试",
          bengali: "অনুরোধের সময় শেষ হয়েছে, অনুগ্রহ করে পরে আবার চেষ্টা করুন",
        },
        {
          chinese: "网络连接问题，请检查您的连接",
          bengali:
            "নেটওয়ার্ক সংযোগ সমস্যা, অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করুন",
        },
      ];
    }

    if (error.message.includes("400")) {
      console.error("Bad request - likely invalid API key or model");
      return [
        {
          chinese: "API 配置错误，请检查您的密钥",
          bengali: "API কনফিগারেশন ত্রুটি, অনুগ্রহ করে আপনার কী পরীক্ষা করুন",
        },
        {
          chinese: "请在扩展设置中更新 API 密钥",
          bengali: "অনুগ্রহ করে এক্সটেনশন সেটিংসে API কী আপডেট করুন",
        },
      ];
    }

    // Fallback suggestions for other errors
    return [
      {
        chinese: "您好，我想了解更多关于这个产品的信息。",
        bengali: "হ্যালো, আমি এই পণ্য সম্পর্কে আরও তথ্য জানতে চাই।",
      },
      {
        chinese: "我们可以讨论一下价格吗？",
        bengali: "আমরা দাম নিয়ে আলোচনা করতে পারি?",
      },
    ];
  }
}

// Summarize conversation from filtered messages
async function summarizeConversation(messages, summaryType = 'messages', summaryValue = '10') {
  // Get API key and model from Chrome storage
  const result = await chrome.storage.sync.get(["groqApiKey", "groqModel"]);
  const API_KEY = result.groqApiKey;
  const MODEL = result.groqModel || "llama-3.1-8b-instant";

  if (!API_KEY || API_KEY.trim() === "") {
    console.log("Groq API key not set. Please configure in extension popup.");
    return {
      summary: "Please set your Groq API key in the extension settings to use the note-taking feature.",
      keyPoints: [],
      timestamp: new Date().toISOString(),
    };
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  // Format conversation for summarization
  let conversationText = "";
  if (messages && messages.length > 0) {
    conversationText = messages
      .map((msg, index) => 
        `${index + 1}. ${msg.type === "seller" ? "Seller" : "Buyer"}: ${msg.text}`
      )
      .join("\n");
  } else {
    return {
      summary: `No conversation messages found for ${summaryType} filter.`,
      keyPoints: [],
      timestamp: new Date().toISOString(),
      summaryType,
      summaryValue,
      messageCount: 0
    };
  }

  // Create context-specific prompts based on summary type
  let systemPrompt = `You are an expert business analyst specializing in international trade conversations. Your task is to analyze conversations between buyers and Chinese sellers and create concise, actionable summaries.`;
  let analysisContext = "";

  switch (summaryType) {
    case 'topic':
      if (summaryValue === 'product') {
        systemPrompt += ` Focus specifically on PRODUCT-RELATED discussions including specifications, quality, materials, features, models, and technical details.`;
        analysisContext = "Focus on product specifications, quality discussions, and technical requirements.";
      } else if (summaryValue === 'price') {
        systemPrompt += ` Focus specifically on PRICING discussions including costs, discounts, negotiations, payment terms, and budget considerations.`;
        analysisContext = "Focus on price negotiations, discounts, cost discussions, and payment terms.";
      } else if (summaryValue === 'shipping') {
        systemPrompt += ` Focus specifically on SHIPPING AND LOGISTICS discussions including delivery times, shipping costs, customs, and logistics arrangements.`;
        analysisContext = "Focus on shipping methods, delivery times, logistics costs, and customs procedures.";
      }
      break;
    
    case 'time':
      if (summaryValue === '30') {
        analysisContext = "Analyze recent conversation from the last 30 minutes for immediate context and urgent matters.";
      } else if (summaryValue === '60') {
        analysisContext = "Analyze conversation from the last hour for recent developments and current status.";
      } else if (summaryValue === '1440') {
        analysisContext = "Analyze today's conversation for daily progress and overall discussion trends.";
      }
      break;
    
    case 'messages':
      analysisContext = `Analyze the last ${summaryValue} messages for recent conversation context and current discussion points.`;
      break;
    
    case 'all':
      analysisContext = "Provide a comprehensive analysis of the entire conversation history for complete context and full negotiation overview.";
      break;
  }

  try {
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}

${analysisContext}

Create a comprehensive summary that includes:
1. A brief overview of the conversation context
2. Key discussion points (prices, products, quantities, terms)
3. Current negotiation status
4. Important deadlines or next steps
5. Seller's position and buyer's requirements

Format your response as JSON with this structure:
{
  "summary": "Brief 2-3 sentence overview of the conversation",
  "keyPoints": [
    "Key point 1",
    "Key point 2", 
    "Key point 3",
    "etc..."
  ],
  "nextSteps": "Recommended next actions",
  "dealStatus": "Current status of negotiations"
}

Keep each key point concise but informative. Focus on actionable insights and important details for future reference.`,
        },
        {
          role: "user",
          content: `Please analyze and summarize this conversation between a buyer and Chinese seller. ${analysisContext}

Conversation (${messages.length} messages):
${conversationText}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    };

    console.log(`Sending ${summaryType} summarization request to Groq API`);

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
    console.log("Groq Summarization Response:", data);

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in Groq API response");
    }

    // Try to parse as JSON, fallback to text parsing if needed
    let parsedSummary;
    try {
      parsedSummary = JSON.parse(content);
    } catch (parseError) {
      console.log("Failed to parse JSON, using text parsing fallback");
      
      // Fallback text parsing
      const lines = content.split('\n').filter(line => line.trim());
      const summary = lines[0] || "Conversation summary unavailable";
      const keyPoints = lines.slice(1, 6).map(line => line.replace(/^[-*•]\s*/, ''));
      
      parsedSummary = {
        summary: summary,
        keyPoints: keyPoints,
        nextSteps: "Review conversation for next actions",
        dealStatus: "In progress"
      };
    }

    // Add metadata
    const finalSummary = {
      ...parsedSummary,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      conversationId: Date.now().toString(),
      summaryType: summaryType,
      summaryValue: summaryValue
    };

    // Store the summary in Chrome storage
    const summaryKey = `summary_${Date.now()}`;
    const storageData = {};
    storageData[summaryKey] = finalSummary;
    
    chrome.storage.local.set(storageData, () => {
      console.log(`${summaryType} summary saved to storage`);
    });

    return finalSummary;

  } catch (error) {
    console.error("Conversation summarization error:", error);
    
    // Return a basic summary on error
    return {
      summary: `Error generating AI summary for ${summaryType} analysis. Conversation included ${messages.length} messages between buyer and seller.`,
      keyPoints: [
        "AI summarization service unavailable",
        "Manual review recommended",
        `${messages.length} messages analyzed`,
        `Filter applied: ${summaryType} - ${summaryValue}`
      ],
      nextSteps: "Review conversation manually or retry summarization",
      dealStatus: "Unknown - requires manual review",
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      summaryType: summaryType,
      summaryValue: summaryValue,
      error: error.message
    };
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("1688 Chat Translator extension installed");
});
