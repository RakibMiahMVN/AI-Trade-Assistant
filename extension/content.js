// Content script for AI Trade Assistant
console.log("AI Trade Assistant content script loaded");

// Add CSS animations for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Detect seller messages and add translation overlays
function scanForSellerMessages() {
  const sellerMessages = document.querySelectorAll(
    ".seller-msg:not(.translated)"
  );
  console.log("Scanning for seller messages, found:", sellerMessages.length);

  sellerMessages.forEach(async (msgElement) => {
    const chineseText = msgElement.textContent.trim();
    console.log("Processing seller message:", chineseText);

    if (chineseText) {
      try {
        // Get buyer language from storage
        const result = await chrome.storage.sync.get(["buyerLanguage"]);
        const buyerLanguage = result.buyerLanguage || "en";

        // Request translation from background script (Chinese to buyer language)
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: chineseText,
          from: "zh",
          to: buyerLanguage,
        });

        if (response.translation) {
          console.log("Seller translation result:", response.translation);
          addTranslationOverlay(
            msgElement,
            response.translation,
            "seller",
            buyerLanguage
          );
          msgElement.classList.add("translated");
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  // Add intention analysis buttons to the last 3 seller messages
  addIntentionButtons();
  // Add auto-negotiation button (TESTING FEATURE)
  addAutoNegotiationButtons();
}

// Detect buyer messages and add translation overlays
function scanForBuyerMessages() {
  const buyerMessages = document.querySelectorAll(".user-msg:not(.translated)");
  console.log("Scanning for buyer messages, found:", buyerMessages.length);

  buyerMessages.forEach(async (msgElement) => {
    const buyerText = msgElement.textContent.trim();
    console.log("Processing buyer message:", buyerText);

    if (buyerText) {
      try {
        // Get buyer language from storage
        const result = await chrome.storage.sync.get(["buyerLanguage"]);
        const buyerLanguage = result.buyerLanguage || "en";

        // Request translation from background script (Chinese to buyer language)
        // Assuming buyer messages are in Chinese (as they appear on the site)
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: buyerText,
          from: "zh",
          to: buyerLanguage,
        });

        if (response.translation) {
          console.log("Buyer translation result:", response.translation);
          addTranslationOverlay(
            msgElement,
            response.translation,
            "buyer",
            buyerLanguage
          );
          msgElement.classList.add("translated");
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  // Add bookmark buttons to buyer messages
  addBookmarkButtons();
}

// Add translation overlay to message
function addTranslationOverlay(
  messageElement,
  translation,
  type = "seller",
  targetLanguage = "en"
) {
  const overlay = document.createElement("div");
  overlay.className = `translation-overlay ${type}-translation`;

  // Get flag emoji based on target language
  const getFlagEmoji = (lang) => {
    const flags = {
      en: "🇺🇸",
      bn: "🇧🇩",
      hi: "🇮🇳",
      ur: "🇵🇰",
      ar: "🇸🇦",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      pt: "🇵🇹",
      ru: "🇷🇺",
      ja: "🇯🇵",
      ko: "🇰🇷",
      th: "🇹🇭",
      vi: "🇻🇳",
      zh: "🇨🇳",
    };
    return flags[lang] || "🌐";
  };

  const flagEmoji = getFlagEmoji(targetLanguage);

  if (type === "buyer") {
    // Buyer messages: show translation in buyer language with blue styling
    overlay.textContent = `${flagEmoji} ${translation}`;
    overlay.style.cssText = `
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
      font-size: 13px;
      color: #1565c0;
      font-weight: 500;
      cursor: pointer;
    `;
  } else {
    // Seller messages: show translation in buyer language with orange styling
    overlay.textContent = `${flagEmoji} ${translation}`;
    overlay.style.cssText = `
      background: rgba(255, 107, 53, 0.1);
      border: 1px solid #ff6b35;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
      font-size: 13px;
      color: #d84315;
      font-weight: 500;
      cursor: pointer;
    `;
  }

  // Add click handler to the original message to toggle translation
  messageElement.style.cursor = "pointer";
  messageElement.onclick = (e) => {
    // Only toggle if clicking on the text content, not on buttons or other elements
    if (
      e.target === messageElement ||
      e.target.nodeType === Node.TEXT_NODE ||
      e.target.parentNode === messageElement
    ) {
      e.stopPropagation();
      overlay.style.display =
        overlay.style.display === "none" ? "block" : "none";
    }
  };

  // Don't make overlay clickable
  // overlay.onclick = ...

  messageElement.appendChild(overlay);
}

// Add bookmark buttons to buyer messages
function addBookmarkButtons() {
  const buyerMessages = document.querySelectorAll(".user-msg");

  buyerMessages.forEach((msgElement) => {
    // Check if button already exists
    if (msgElement.parentNode.querySelector(".bookmark-btn")) return;

    // Create bookmark button
    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.className = "bookmark-btn";
    bookmarkBtn.textContent = "🔖";
    bookmarkBtn.title = "Bookmark this message";
    bookmarkBtn.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      background: #4caf50;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      z-index: 10;
    `;

    bookmarkBtn.onmouseover = () => {
      bookmarkBtn.style.background = "#388e3c";
      bookmarkBtn.style.transform = "scale(1.1)";
    };

    bookmarkBtn.onmouseout = () => {
      bookmarkBtn.style.background = "#4caf50";
      bookmarkBtn.style.transform = "scale(1)";
    };

    bookmarkBtn.onclick = () => {
      bookmarkMessage(msgElement);
    };

    // Make message content position relative for absolute positioning
    const messageContent = msgElement.parentNode;
    if (
      messageContent &&
      getComputedStyle(messageContent).position === "static"
    ) {
      messageContent.style.position = "relative";
    }

    // Insert button into the message content
    messageContent.appendChild(bookmarkBtn);
  });
}

// Add intention analysis button to the last seller message only
function addIntentionButtons() {
  const allSellerMessages = document.querySelectorAll(".seller-msg");
  if (allSellerMessages.length === 0) return;

  // Get only the last seller message
  const lastSellerMessage = allSellerMessages[allSellerMessages.length - 1];

  // Check if button already exists
  if (lastSellerMessage.parentNode.querySelector(".intention-btn")) return;

  // Create intention analysis button
  const intentionBtn = document.createElement("button");
  intentionBtn.className = "intention-btn";
  intentionBtn.textContent = "?";
  intentionBtn.title = "Analyze seller intention";
  intentionBtn.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff6b35;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 10;
  `;

  intentionBtn.onmouseover = () => {
    intentionBtn.style.background = "#e55a2b";
    intentionBtn.style.transform = "scale(1.1)";
  };

  intentionBtn.onmouseout = () => {
    intentionBtn.style.background = "#ff6b35";
    intentionBtn.style.transform = "scale(1)";
  };

  intentionBtn.onclick = () => {
    analyzeSellerIntention(lastSellerMessage);
  };

  // Make message content position relative for absolute positioning
  const messageContent = lastSellerMessage.parentNode;
  if (
    messageContent &&
    getComputedStyle(messageContent).position === "static"
  ) {
    messageContent.style.position = "relative";
  }

  // Insert button into the message content
  messageContent.appendChild(intentionBtn);
}

// Add auto-negotiation button to the last seller message only (TESTING FEATURE)
function addAutoNegotiationButtons() {
  const allSellerMessages = document.querySelectorAll(".seller-msg");
  if (allSellerMessages.length === 0) return;

  // Get only the last seller message
  const lastSellerMessage = allSellerMessages[allSellerMessages.length - 1];

  // Check if button already exists
  if (lastSellerMessage.parentNode.querySelector(".auto-negotiate-btn")) return;

  // Create auto-negotiation button
  const autoNegotiateBtn = document.createElement("button");
  autoNegotiateBtn.className = "auto-negotiate-btn";
  autoNegotiateBtn.textContent = "🤖";
  autoNegotiateBtn.title = "Auto-negotiate (TESTING)";
  autoNegotiateBtn.style.cssText = `
    position: absolute;
    top: -8px;
    right: 20px;
    background: #9c27b0;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 10;
  `;

  autoNegotiateBtn.onmouseover = () => {
    autoNegotiateBtn.style.background = "#7b1fa2";
    autoNegotiateBtn.style.transform = "scale(1.1)";
  };

  autoNegotiateBtn.onmouseout = () => {
    autoNegotiateBtn.style.background = "#9c27b0";
    autoNegotiateBtn.style.transform = "scale(1)";
  };

  autoNegotiateBtn.onclick = () => {
    startAutoNegotiation(lastSellerMessage);
  };

  // Make message content position relative for absolute positioning
  const messageContent = lastSellerMessage.parentNode;
  if (
    messageContent &&
    getComputedStyle(messageContent).position === "static"
  ) {
    messageContent.style.position = "relative";
  }

  // Insert button into the message content
  messageContent.appendChild(autoNegotiateBtn);
} // Bookmark a buyer message
async function bookmarkMessage(messageElement) {
  // Extract only the original text, excluding translation overlays
  const originalText = Array.from(messageElement.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .join("")
    .trim();

  if (!originalText) return;

  // Get existing bookmarks
  const bookmarks = getBookmarks();

  // Check if already bookmarked (compare original text)
  if (bookmarks.some((bookmark) => bookmark.originalText === originalText)) {
    showBookmarkNotification("Already bookmarked!", "#ff9800");
    return;
  }

  // Check limit (max 10 bookmarks)
  if (bookmarks.length >= 10) {
    showBookmarkNotification("Maximum 10 bookmarks allowed!", "#f44336");
    return;
  }

  // Get buyer's language for translation
  let buyerLanguage = "en";
  try {
    const result = await chrome.storage.sync.get(["buyerLanguage"]);
    buyerLanguage = result.buyerLanguage || "en";
  } catch (error) {
    console.error("Failed to get buyer language:", error);
  }

  // The originalText is the original Chinese text (as displayed on the site)
  // We need to translate it to the buyer's language for display in bookmarks
  let translatedText = originalText; // fallback to original if translation fails

  if (buyerLanguage !== "zh") {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "translate",
        text: originalText,
        from: "zh",
        to: buyerLanguage,
      });
      if (response.translation) {
        translatedText = response.translation;
      }
    } catch (error) {
      console.error("Translation error for bookmark:", error);
    }
  }

  // Add new bookmark with both original and translated text
  const newBookmark = {
    id: Date.now().toString(),
    originalText: originalText, // Chinese text (what gets sent)
    translatedText: translatedText, // Translated text (for display)
    buyerLanguage: buyerLanguage,
    created: new Date().toISOString(),
  };

  bookmarks.push(newBookmark);
  saveBookmarks(bookmarks);

  // Show success message
  showBookmarkNotification("Message bookmarked! 📖", "#4caf50");

  // Update bookmark button appearance
  const btn = messageElement.parentNode.querySelector(".bookmark-btn");
  if (btn) {
    btn.style.background = "#388e3c";
    btn.textContent = "✓";
    setTimeout(() => {
      if (btn) {
        btn.style.background = "#4caf50";
        btn.textContent = "🔖";
      }
    }, 2000);
  }
}

// Show bookmark notification
function showBookmarkNotification(message, color) {
  // Remove existing notification
  const existingNotification = document.querySelector(".bookmark-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = "bookmark-notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10002;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 3000);
}

// Get custom goals from localStorage
function getCustomGoals() {
  try {
    const goals = localStorage.getItem("aiTradeAssistantCustomGoals");
    return goals ? JSON.parse(goals) : [];
  } catch (error) {
    console.error("Error getting custom goals:", error);
    return [];
  }
}

// Save custom goals to localStorage
function saveCustomGoals(goals) {
  try {
    localStorage.setItem("aiTradeAssistantCustomGoals", JSON.stringify(goals));
  } catch (error) {
    console.error("Error saving custom goals:", error);
  }
}

// Add a new custom goal
function addCustomGoal(goalText) {
  if (!goalText || !goalText.trim()) return false;

  const goals = getCustomGoals();

  // Check if goal already exists
  if (
    goals.some((goal) => goal.text.toLowerCase() === goalText.toLowerCase())
  ) {
    return false; // Already exists
  }

  // Check limit
  if (goals.length >= 10) {
    return false; // Max limit reached
  }

  const newGoal = {
    id: Date.now().toString(),
    text: goalText.trim(),
    created: new Date().toISOString(),
    usageCount: 0,
  };

  goals.push(newGoal);
  saveCustomGoals(goals);
  return true;
}

// Delete a custom goal
function deleteCustomGoal(goalId) {
  const goals = getCustomGoals();
  const updatedGoals = goals.filter((goal) => goal.id !== goalId);
  saveCustomGoals(updatedGoals);
}

// Increment usage count for a custom goal
function incrementGoalUsage(goalId) {
  const goals = getCustomGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (goal) {
    goal.usageCount = (goal.usageCount || 0) + 1;
    saveCustomGoals(goals);
  }
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(
      "aiTradeAssistantBookmarks",
      JSON.stringify(bookmarks)
    );
  } catch (error) {
    console.error("Error saving bookmarks:", error);
  }
}

// Get bookmarks from localStorage
function getBookmarks() {
  try {
    const bookmarks = localStorage.getItem("aiTradeAssistantBookmarks");
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error("Error getting bookmarks:", error);
    return [];
  }
}

// Show bookmark suggestions when input field is focused
function showBookmarkSuggestions(inputField) {
  const bookmarks = getBookmarks();
  if (bookmarks.length === 0) return;

  // Remove existing bookmark suggestions
  hideBookmarkSuggestions();

  // Create suggestions container
  const container = document.createElement("div");
  container.id = "bookmark-suggestions-container";
  container.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    margin-bottom: 5px;
  `;

  // Add header
  const header = document.createElement("div");
  header.textContent = "📖 Bookmarked Messages";
  header.style.cssText = `
    padding: 8px 12px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    font-weight: 500;
    font-size: 12px;
    color: #666;
  `;
  container.appendChild(header);

  // Add bookmark items
  bookmarks.forEach((bookmark) => {
    const item = document.createElement("div");
    item.className = "bookmark-suggestion-item";
    item.style.cssText = `
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    item.onmouseover = () => {
      item.style.backgroundColor = "#f8f9fa";
    };

    item.onmouseout = () => {
      item.style.backgroundColor = "transparent";
    };

    item.onclick = () => {
      // Insert the original Chinese text (what actually gets sent)
      inputField.value = bookmark.originalText;
      inputField.dispatchEvent(new Event("input", { bubbles: true }));
      hideBookmarkSuggestions();
      inputField.focus();
    };

    // Bookmark text (show translated text for user recognition, truncated if too long)
    const textSpan = document.createElement("span");
    const displayText = bookmark.translatedText || bookmark.originalText;
    textSpan.textContent =
      displayText.length > 50
        ? displayText.substring(0, 50) + "..."
        : displayText;
    textSpan.style.cssText = `
      flex: 1;
      font-size: 13px;
      color: #333;
    `;

    // Language indicator if different from current
    if (bookmark.buyerLanguage && bookmark.buyerLanguage !== "en") {
      const langIndicator = document.createElement("span");
      langIndicator.textContent = ` (${bookmark.buyerLanguage.toUpperCase()})`;
      langIndicator.style.cssText = `
        font-size: 11px;
        color: #666;
        font-weight: normal;
      `;
      textSpan.appendChild(langIndicator);
    }

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete bookmark";
    deleteBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      padding: 2px;
      opacity: 0.6;
    `;

    deleteBtn.onmouseover = () => {
      deleteBtn.style.opacity = "1";
    };

    deleteBtn.onmouseout = () => {
      deleteBtn.style.opacity = "0.6";
    };

    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteBookmark(bookmark.id);
      showBookmarkSuggestions(inputField); // Refresh the list
    };

    item.appendChild(textSpan);
    item.appendChild(deleteBtn);
    container.appendChild(item);
  });

  // Insert container into the input field's parent
  const inputWrapper = inputField.parentNode;
  if (inputWrapper) {
    inputWrapper.style.position = "relative";
    inputWrapper.appendChild(container);
  }
}

// Hide bookmark suggestions
function hideBookmarkSuggestions() {
  const container = document.getElementById("bookmark-suggestions-container");
  if (container) {
    container.remove();
  }
}

// Delete a bookmark
function deleteBookmark(bookmarkId) {
  const bookmarks = getBookmarks();
  const updatedBookmarks = bookmarks.filter(
    (bookmark) => bookmark.id !== bookmarkId
  );
  saveBookmarks(updatedBookmarks);
  showBookmarkNotification("Bookmark deleted!", "#ff9800");
}

// Show intention analysis in a popup
async function showIntentionAnalysis(analysis, messageElement) {
  // Get buyer's language from storage
  let buyerLanguage = "en";
  try {
    const result = await chrome.storage.sync.get(["buyerLanguage"]);
    buyerLanguage = result.buyerLanguage || "en";
  } catch (error) {
    console.error("Failed to get buyer language:", error);
  }

  // Remove existing analysis popup
  const existingPopup = document.querySelector(".intention-analysis-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create analysis popup
  const popup = document.createElement("div");
  popup.className = "intention-analysis-popup";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    font-family: Arial, sans-serif;
    border: 2px solid #ff6b35;
  `;

  const title = document.createElement("h3");
  title.textContent = "🤔 Seller Message Analysis";
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #ff6b35;
    font-size: 18px;
    text-align: center;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    line-height: 1.6;
  `;

  // Show loading state while translating
  const loadingDiv = document.createElement("div");
  loadingDiv.textContent = "Translating analysis...";
  loadingDiv.style.cssText = `text-align: center; color: #666; padding: 20px;`;
  content.appendChild(loadingDiv);

  popup.appendChild(title);
  popup.appendChild(content);
  document.body.appendChild(popup);

  try {
    // Translate analysis fields to buyer's language
    const translatedAnalysis = {
      tone: analysis.tone,
      firmness: analysis.firmness,
      moq_flexibility: analysis.moq_flexibility,
      key_points: analysis.key_points || [],
    };

    // Only translate if buyer language is not English
    if (buyerLanguage !== "en") {
      // Translate each field
      const fieldsToTranslate = [
        analysis.tone,
        analysis.firmness,
        analysis.moq_flexibility,
        ...analysis.key_points,
      ].filter((text) => text && text.trim());

      const translations = await Promise.all(
        fieldsToTranslate.map((text) =>
          chrome.runtime
            .sendMessage({
              action: "translate",
              text: text,
              from: "en",
              to: buyerLanguage,
            })
            .then((response) => response.translation || text)
            .catch((error) => {
              console.error("Translation error:", error);
              return text; // Fallback to original text
            })
        )
      );

      // Map translations back to analysis object
      translatedAnalysis.tone = translations[0] || analysis.tone;
      translatedAnalysis.firmness = translations[1] || analysis.firmness;
      translatedAnalysis.moq_flexibility =
        translations[2] || analysis.moq_flexibility;
      translatedAnalysis.key_points = translations
        .slice(3)
        .map((translated, index) => translated || analysis.key_points[index]);
    }

    // Clear loading state and display translated analysis
    content.innerHTML = "";

    // Display analysis results with both English and translated versions
    const toneDiv = document.createElement("div");
    toneDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const firmnessDiv = document.createElement("div");
    firmnessDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const moqDiv = document.createElement("div");
    moqDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const keyPointsDiv = document.createElement("div");
    keyPointsDiv.style.cssText = `margin-bottom: 8px; color: #333;`;

    // Show English versions first
    toneDiv.innerHTML += `<strong>Tone:</strong> <span style="color: #1565c0;">${
      analysis.tone || "Neutral"
    }</span>`;
    firmnessDiv.innerHTML += `<strong>Price Firmness:</strong> <span style="color: #1565c0;">${
      analysis.firmness || "Moderate"
    }</span>`;
    moqDiv.innerHTML += `<strong>MOQ Flexibility:</strong> <span style="color: #1565c0;">${
      analysis.moq_flexibility || "Standard"
    }</span>`;
    keyPointsDiv.innerHTML += `<strong>Key Points:</strong>`;

    // Add Bengali translations if buyer language is Bengali
    if (buyerLanguage === "bn") {
      toneDiv.innerHTML += `<br><span style="color: #d32f2f; font-size: 13px;">${
        translatedAnalysis.tone || analysis.tone
      }</span>`;
      firmnessDiv.innerHTML += `<br><span style="color: #d32f2f; font-size: 13px;">${
        translatedAnalysis.firmness || analysis.firmness
      }</span>`;
      moqDiv.innerHTML += `<br><span style="color: #d32f2f; font-size: 13px;">${
        translatedAnalysis.moq_flexibility || analysis.moq_flexibility
      }</span>`;
    }

    const pointsList = document.createElement("ul");
    pointsList.style.cssText = `margin: 5px 0 0 20px; padding: 0;`;

    if (analysis.key_points && Array.isArray(analysis.key_points)) {
      analysis.key_points.forEach((point, index) => {
        const li = document.createElement("li");
        li.style.cssText = `margin-bottom: 6px; color: #555;`;

        // English version
        li.innerHTML = `<span style="color: #1565c0;">${point}</span>`;

        // Bengali translation if applicable
        if (buyerLanguage === "bn" && translatedAnalysis.key_points[index]) {
          li.innerHTML += `<br><span style="color: #d32f2f; font-size: 13px;">${translatedAnalysis.key_points[index]}</span>`;
        }

        pointsList.appendChild(li);
      });
    }

    content.appendChild(toneDiv);
    content.appendChild(firmnessDiv);
    content.appendChild(moqDiv);
    content.appendChild(keyPointsDiv);
    content.appendChild(pointsList);
  } catch (error) {
    console.error("Error displaying analysis:", error);
    // Fallback to original analysis without translation
    content.innerHTML = "";

    const toneDiv = document.createElement("div");
    toneDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const firmnessDiv = document.createElement("div");
    firmnessDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const moqDiv = document.createElement("div");
    moqDiv.style.cssText = `margin-bottom: 12px; color: #333;`;

    const keyPointsDiv = document.createElement("div");
    keyPointsDiv.style.cssText = `margin-bottom: 8px; color: #333;`;

    // Show English versions
    toneDiv.innerHTML = `<strong>Tone:</strong> <span style="color: #1565c0;">${
      analysis.tone || "Neutral"
    }</span>`;
    firmnessDiv.innerHTML = `<strong>Price Firmness:</strong> <span style="color: #1565c0;">${
      analysis.firmness || "Moderate"
    }</span>`;
    moqDiv.innerHTML = `<strong>MOQ Flexibility:</strong> <span style="color: #1565c0;">${
      analysis.moq_flexibility || "Standard"
    }</span>`;
    keyPointsDiv.innerHTML = `<strong>Key Points:</strong>`;

    // Add Bengali note if buyer language is Bengali
    if (buyerLanguage === "bn") {
      toneDiv.innerHTML += `<br><span style="color: #666; font-size: 12px;">(Translation failed - showing English only)</span>`;
      firmnessDiv.innerHTML += `<br><span style="color: #666; font-size: 12px;">(Translation failed - showing English only)</span>`;
      moqDiv.innerHTML += `<br><span style="color: #666; font-size: 12px;">(Translation failed - showing English only)</span>`;
    }

    const pointsList = document.createElement("ul");
    pointsList.style.cssText = `margin: 5px 0 0 20px; padding: 0;`;
    if (analysis.key_points && Array.isArray(analysis.key_points)) {
      analysis.key_points.forEach((point) => {
        const li = document.createElement("li");
        li.innerHTML = `<span style="color: #1565c0;">${point}</span>`;
        li.style.cssText = `margin-bottom: 6px; color: #555;`;
        pointsList.appendChild(li);
      });
    }

    content.appendChild(toneDiv);
    content.appendChild(firmnessDiv);
    content.appendChild(moqDiv);
    content.appendChild(keyPointsDiv);
    content.appendChild(pointsList);
  }

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    display: block;
    margin: 15px auto 0;
    padding: 8px 16px;
    background: #ff6b35;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;

  closeBtn.onclick = () => {
    popup.remove();
  };

  content.appendChild(closeBtn);

  // Close on background click
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

// Analyze seller intention using AI
async function analyzeSellerIntention(messageElement) {
  // Collect the last 3 seller messages for better context
  const sellerMessages = [];
  const allSellerMessages = document.querySelectorAll(".seller-msg");

  // Get the last 3 seller messages (most recent first)
  const lastThreeSellerMessages = Array.from(allSellerMessages).slice(-3);

  for (const msgElement of lastThreeSellerMessages) {
    // Extract only the original text, excluding translation overlays
    const messageText = Array.from(msgElement.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join("")
      .trim();

    if (messageText) {
      sellerMessages.push(messageText);
    }
  }

  if (sellerMessages.length === 0) return;

  try {
    // Send to background script for AI analysis
    const response = await chrome.runtime.sendMessage({
      action: "analyze_intention",
      messages: sellerMessages, // Send array of messages instead of single text
    });

    if (response && response.analysis) {
      showIntentionAnalysis(response.analysis, messageElement);
    } else {
      console.error("Failed to analyze seller intention");
      // Show error message
      showIntentionAnalysis(
        {
          tone: "Unable to analyze",
          firmness: "Unable to analyze",
          moq_flexibility: "Unable to analyze",
          key_points: ["Analysis failed - please try again"],
        },
        messageElement
      );
    }
  } catch (error) {
    console.error("Error analyzing seller intention:", error);
    // Show error message
    showIntentionAnalysis(
      {
        tone: "Error occurred",
        firmness: "Error occurred",
        moq_flexibility: "Error occurred",
        key_points: ["An error occurred while analyzing the message"],
      },
      messageElement
    );
  }
}

// Start auto-negotiation simulation (TESTING FEATURE)
async function startAutoNegotiation(messageElement) {
  // Collect last 3 conversations from both sides
  const conversation = [];
  const messageElements = document.querySelectorAll(".seller-msg, .user-msg");

  // Separate seller and buyer messages
  const sellerMessages = [];
  const buyerMessages = [];

  messageElements.forEach((el) => {
    const content = el.querySelector(".message-content");
    let text = "";

    if (content) {
      // Get the first text node (original message) and ignore overlay elements
      const childNodes = Array.from(content.childNodes);
      const textNode = childNodes.find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      if (textNode) {
        text = textNode.textContent.trim();
      } else if (childNodes.length > 0) {
        // Fallback: get text from first child if no direct text node
        text = childNodes[0].textContent
          ? childNodes[0].textContent.trim()
          : "";
      }
    } else {
      // If no message-content div, extract only text nodes excluding overlays
      text = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join("")
        .trim();
    }

    if (text) {
      const type = el.classList.contains("seller-msg") ? "seller" : "buyer";
      const messageData = {
        text: text,
        type: type,
        element: el, // Keep reference to element for ordering
      };

      if (type === "seller") {
        sellerMessages.push(messageData);
      } else {
        buyerMessages.push(messageData);
      }
    }
  });

  // Get last 3 from each side
  const last3Seller = sellerMessages.slice(-3);
  const last3Buyer = buyerMessages.slice(-3);

  // Combine and sort chronologically (by DOM position)
  const combinedMessages = [...last3Seller, ...last3Buyer].sort((a, b) => {
    // Sort by position in DOM to maintain chronological order
    const allMessages = Array.from(messageElements);
    return allMessages.indexOf(a.element) - allMessages.indexOf(b.element);
  });

  // Extract just the text and type for the conversation
  combinedMessages.forEach((msg) => {
    conversation.push({
      text: msg.text,
      type: msg.type,
    });
  });

  if (conversation.length === 0) return;

  // Show simulation modal with recent conversation
  await showNegotiationSimulation(conversation);
}

// Expose function globally for testing
window.startAutoNegotiation = startAutoNegotiation;

// Show negotiation simulation modal
async function showNegotiationSimulation(fullConversation) {
  // Remove existing modal if any
  const existingModal = document.querySelector(".negotiation-simulation-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal overlay
  const modal = document.createElement("div");
  modal.className = "negotiation-simulation-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  `;

  const title = document.createElement("h3");
  title.textContent = "🤖 Auto-Negotiation Simulation (TESTING)";
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #9c27b0;
    font-size: 18px;
    text-align: center;
  `;

  const progressDiv = document.createElement("div");
  progressDiv.style.cssText = `
    margin-bottom: 15px;
    text-align: center;
    color: #666;
  `;

  const conversationDiv = document.createElement("div");
  conversationDiv.id = "negotiation-conversation";
  conversationDiv.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin-bottom: 15px;
    max-height: 300px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background: #f9f9f9;
  `;

  const resultDiv = document.createElement("div");
  resultDiv.id = "negotiation-result";
  resultDiv.style.cssText = `
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 8px;
    display: none;
  `;

  const buttonDiv = document.createElement("div");
  buttonDiv.style.cssText = `
    display: flex;
    gap: 10px;
    justify-content: center;
  `;

  const startBtn = document.createElement("button");
  startBtn.textContent = "Start Simulation";
  startBtn.style.cssText = `
    padding: 8px 16px;
    background: #9c27b0;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;

  const stopBtn = document.createElement("button");
  stopBtn.textContent = "Stop";
  stopBtn.style.cssText = `
    padding: 8px 16px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: none;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;

  buttonDiv.appendChild(startBtn);
  buttonDiv.appendChild(stopBtn);
  buttonDiv.appendChild(closeBtn);

  modalContent.appendChild(title);
  modalContent.appendChild(progressDiv);
  modalContent.appendChild(conversationDiv);
  modalContent.appendChild(resultDiv);
  modalContent.appendChild(buttonDiv);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  let isRunning = false;
  let conversation = [...fullConversation]; // Start with full conversation history

  // Add existing conversation to display
  for (const msg of conversation) {
    const color = msg.type === "seller" ? "#ff6b35" : "#2196f3";
    const sender = msg.type === "seller" ? "Seller" : "Buyer";
    await addMessageToConversation(conversationDiv, sender, msg.text, color);
  }

  startBtn.onclick = async () => {
    if (isRunning) return;
    isRunning = true;
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    resultDiv.style.display = "none";

    await runNegotiationSimulation(
      conversation,
      conversationDiv,
      progressDiv,
      resultDiv
    );
  };

  stopBtn.onclick = () => {
    isRunning = false;
    stopBtn.style.display = "none";
    startBtn.style.display = "inline-block";
    progressDiv.textContent = "Simulation stopped";
  };

  closeBtn.onclick = () => {
    modal.remove();
  };

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Add message to conversation display
async function addMessageToConversation(container, sender, message, color) {
  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
    margin-bottom: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    background: ${color}20;
    border-left: 3px solid ${color};
  `;

  const senderSpan = document.createElement("strong");
  senderSpan.textContent = `${sender}: `;
  senderSpan.style.color = color;

  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(document.createTextNode(message));

  // Add translations
  try {
    // Translate to English
    const enResponse = await chrome.runtime.sendMessage({
      action: "translate",
      text: message,
      from: "zh",
      to: "en",
    });
    if (enResponse.translation) {
      const enDiv = document.createElement("div");
      enDiv.textContent = `🇺🇸 ${enResponse.translation}`;
      enDiv.style.cssText = `font-size: 12px; color: #666; margin-top: 4px;`;
      messageDiv.appendChild(enDiv);
    }

    // Translate to Bengali
    const bnResponse = await chrome.runtime.sendMessage({
      action: "translate",
      text: message,
      from: "zh",
      to: "bn",
    });
    if (bnResponse.translation) {
      const bnDiv = document.createElement("div");
      bnDiv.textContent = `🇧🇩 ${bnResponse.translation}`;
      bnDiv.style.cssText = `font-size: 12px; color: #d32f2f; margin-top: 2px;`;
      messageDiv.appendChild(bnDiv);
    }
  } catch (error) {
    console.error("Translation error for message:", error);
  }

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

// Run the negotiation simulation
async function runNegotiationSimulation(
  conversation,
  conversationDiv,
  progressDiv,
  resultDiv
) {
  const maxRounds = 4; // Maximum negotiation rounds
  let currentRound = 0;

  while (currentRound < maxRounds) {
    currentRound++;
    progressDiv.textContent = `Round ${currentRound}/${maxRounds} - Generating responses...`;

    try {
      // Generate buyer response
      const buyerResponse = await generateBuyerResponse(conversation);
      if (!buyerResponse) break;

      conversation.push({ type: "buyer", text: buyerResponse });
      await addMessageToConversation(
        conversationDiv,
        "Buyer",
        buyerResponse,
        "#2196f3"
      );

      progressDiv.textContent = `Round ${currentRound}/${maxRounds} - Seller thinking...`;

      // Generate seller response
      const sellerResponse = await generateSellerResponse(conversation);
      if (!sellerResponse) break;

      conversation.push({ type: "seller", text: sellerResponse });
      await addMessageToConversation(
        conversationDiv,
        "Seller",
        sellerResponse,
        "#ff6b35"
      );

      // Check if negotiation should end (seller agrees or buyer gets what they want)
      if (await shouldEndNegotiation(conversation)) {
        break;
      }

      // Small delay between rounds
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Simulation error:", error);
      progressDiv.textContent = "Error occurred during simulation";
      break;
    }
  }

  // Analyze final result
  progressDiv.textContent = "Analyzing final result...";
  const analysis = await analyzeNegotiationResult(conversation);

  // Translate summary to Bengali
  let translatedSummary = analysis.summary;
  try {
    const translateResponse = await chrome.runtime.sendMessage({
      action: "translate",
      text: analysis.summary,
      from: "en",
      to: "bn",
    });
    if (translateResponse.translation) {
      translatedSummary = translateResponse.translation;
    }
  } catch (error) {
    console.error("Translation error for summary:", error);
  }

  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: ${
      analysis.won ? "#4caf50" : "#f44336"
    };">${analysis.won ? "🎉 Buyer Won!" : "❌ Negotiation Ended"}</h4>
    <p style="margin: 0 0 8px 0; color: #333;"><strong>English:</strong> ${
      analysis.summary
    }</p>
    <p style="margin: 0; color: #d32f2f;"><strong>বাংলা:</strong> ${translatedSummary}</p>
  `;

  progressDiv.textContent = "Simulation complete";
}

// Generate buyer response using existing AI system
async function generateBuyerResponse(conversation) {
  // Use the last few messages for context
  const recentMessages = conversation.slice(-4);

  // Try different negotiation intentions in sequence
  const intentions = [
    "get_better_price",
    "request_samples",
    "request_moq",
    "other",
  ];

  for (const intention of intentions) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "generate_smart_suggestion",
        messages: recentMessages,
        intention: intention,
      });

      if (response && response.suggestions && response.suggestions.length > 0) {
        // Return the first suggestion in Chinese
        return response.suggestions[0].chinese;
      }
    } catch (error) {
      console.error("Buyer response generation error:", error);
    }
  }

  // Fallback response
  return "谢谢您的信息，我想了解更多关于价格和样品的信息。"; // Thank you for the information, I want to know more about price and samples.
}

// Generate seller response using AI
async function generateSellerResponse(conversation) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "generate_seller_response",
      conversation: conversation,
    });

    return response.sellerResponse;
  } catch (error) {
    console.error("Seller response generation error:", error);
    // Fallback seller responses
    const fallbacks = [
      "我们的价格已经很优惠了，但我们可以考虑小批量订单。",
      "我们可以提供样品，但需要您支付运费。",
      "最低起订量是100件，但我们可以商量。",
      "谢谢您的兴趣，我们可以给您更好的价格。",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Check if negotiation should end
async function shouldEndNegotiation(conversation) {
  // Simple check: if conversation has more than 6 exchanges, end it
  return conversation.length >= 6;
}

// Analyze the final negotiation result
async function analyzeNegotiationResult(conversation) {
  const fullConversation = conversation
    .map((msg) => `${msg.type}: ${msg.text}`)
    .join("\n");

  try {
    const response = await chrome.runtime.sendMessage({
      action: "analyze_negotiation_result",
      conversation: fullConversation,
    });

    return response.analysis;
  } catch (error) {
    console.error("Analysis error:", error);
    // Fallback analysis
    return {
      won: Math.random() > 0.5, // Random for testing
      summary: "Analysis failed, but simulation completed successfully.",
    };
  }
}

// Detect input field and add suggestion functionality
function setupInputField() {
  const chatInput = document.getElementById("chat-input");
  if (!chatInput) return;

  // Add translate and suggestion buttons next to input
  injectTranslateButton(chatInput);

  // Show bookmarks when input field is focused
  chatInput.addEventListener("focus", () => {
    showBookmarkSuggestions(chatInput);
  });

  // Hide bookmarks when input loses focus (with delay to allow clicking)
  chatInput.addEventListener("blur", () => {
    setTimeout(() => {
      hideBookmarkSuggestions();
    }, 200);
  });

  // Remove the old auto-suggestion input listener
  // Suggestions are now triggered manually via the suggestion button
}

// Inject translate and suggestion buttons next to input field
function injectTranslateButton(inputField) {
  // Check if buttons already exist
  if (inputField.parentNode.querySelector(".translate-btn")) return;

  // Create unified translate button (combines language toggle + translation)
  const translateBtn = document.createElement("button");
  translateBtn.className = "translate-btn";
  translateBtn.textContent = "EN 中";
  translateBtn.title =
    "Click to translate (EN mode) | Right-click to toggle language";
  translateBtn.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3);
    display: flex;
    align-items: center;
    gap: 4px;
  `;

  // Track current language mode
  let currentLanguage = "en"; // "en" or "bn"

  function updateButtonAppearance() {
    if (currentLanguage === "en") {
      translateBtn.textContent = "EN 中";
      translateBtn.title =
        "Click to translate (English mode) | Right-click to switch to Banglish";
      translateBtn.style.background =
        "linear-gradient(135deg, #ff6b35, #ff8c42)";
      translateBtn.style.boxShadow = "0 2px 4px rgba(255, 107, 53, 0.3)";
    } else {
      translateBtn.textContent = "BN 中";
      translateBtn.title =
        "Click to translate (Banglish mode) | Right-click to switch to English";
      translateBtn.style.background =
        "linear-gradient(135deg, #A0522D, #8B4513)";
      translateBtn.style.boxShadow = "0 2px 4px rgba(160, 82, 45, 0.3)";
    }
  }

  translateBtn.onmouseover = () => {
    const scale = currentLanguage === "en" ? 1.05 : 1.05;
    translateBtn.style.transform = `translateY(-50%) scale(${scale})`;
    translateBtn.style.boxShadow =
      currentLanguage === "en"
        ? "0 4px 12px rgba(255, 107, 53, 0.4)"
        : "0 4px 12px rgba(160, 82, 45, 0.4)";
  };

  translateBtn.onmouseout = () => {
    translateBtn.style.transform = "translateY(-50%) scale(1)";
    updateButtonAppearance();
  };

  // Left click: Translate
  translateBtn.onclick = async () => {
    const text = inputField.value.trim();
    if (!text) return;

    try {
      // Show loading state
      translateBtn.textContent = "...";
      translateBtn.disabled = true;

      if (currentLanguage === "bn") {
        // Use AI translation for Banglish
        const response = await chrome.runtime.sendMessage({
          action: "translate_banglish_to_chinese",
          text: text,
        });

        if (response.translation) {
          inputField.value = response.translation;
          inputField.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else {
        // Use regular translation for English
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: text,
          from: "en",
          to: "zh",
        });

        if (response.translation) {
          inputField.value = response.translation;
          inputField.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      // Reset button
      updateButtonAppearance();
      translateBtn.disabled = false;
    }
  };

  // Right click: Toggle language
  translateBtn.oncontextmenu = (e) => {
    e.preventDefault(); // Prevent context menu
    currentLanguage = currentLanguage === "en" ? "bn" : "en";
    updateButtonAppearance();

    // Visual feedback
    translateBtn.style.transform = "translateY(-50%) scale(1.1)";
    setTimeout(() => {
      translateBtn.style.transform = "translateY(-50%) scale(1)";
    }, 150);
  };

  // Initialize button appearance
  updateButtonAppearance();

  // Create suggested reply button
  const suggestBtn = document.createElement("button");
  suggestBtn.className = "suggest-btn";
  suggestBtn.textContent = "💡";
  suggestBtn.title = "Get AI Suggestion";
  suggestBtn.style.cssText = `
    position: absolute;
    right: 75px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #2196f3, #42a5f5);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
  `;

  suggestBtn.onmouseover = () => {
    suggestBtn.style.transform = "translateY(-50%) scale(1.05)";
    suggestBtn.style.boxShadow = "0 4px 12px rgba(33, 150, 243, 0.4)";
  };

  suggestBtn.onmouseout = () => {
    suggestBtn.style.transform = "translateY(-50%) scale(1)";
    suggestBtn.style.boxShadow = "0 2px 4px rgba(33, 150, 243, 0.3)";
  };

  suggestBtn.onclick = () => {
    showIntentionModal(inputField);
  };

  // Create a wrapper for the input field
  const inputWrapper = document.createElement("div");
  inputWrapper.style.cssText = `
    position: relative;
    flex: 1;
    display: flex;
  `;

  // Create suggestions container for AI suggestions
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.id = "suggestions-container";
  suggestionsContainer.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    margin-bottom: 5px;
    display: none;
  `;

  // Replace input field with wrapper, then put input field inside wrapper
  inputField.parentNode.insertBefore(inputWrapper, inputField);
  inputWrapper.appendChild(inputField);
  inputField.style.flex = "1";
  inputField.style.paddingRight = "85px";
  inputField.style.overflow = "hidden";

  // Insert buttons and suggestions container into the wrapper
  inputWrapper.appendChild(suggestBtn);
  inputWrapper.appendChild(translateBtn);
  inputWrapper.appendChild(suggestionsContainer);

  // Create goals container at bottom of screen
  const goalsContainer = document.createElement("div");
  goalsContainer.id = "goals-container";
  goalsContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 8px;
    background: #f9f9f9;
    border-top: 1px solid #ddd;
    z-index: 999;
    justify-content: center;
  `;

  // Get all intentions
  const allIntentions = [
    { key: "get_better_price", text: "💰 Better Price" },
    { key: "request_samples", text: "📦 Free Samples" },
    { key: "ask_specifications", text: "📋 Specifications" },
    { key: "request_moq", text: "📊 Negotiate MOQ" },
    { key: "other", text: "💬 General" },
  ];

  // Add custom goals with separator
  const customGoals = getCustomGoals();
  if (customGoals.length > 0) {
    allIntentions.push({ separator: true });
    customGoals.forEach((goal) => {
      allIntentions.push({ key: `custom_${goal.id}`, text: `🎯 ${goal.text}` });
    });
  }

  // Create buttons for intentions
  allIntentions.forEach((item) => {
    if (item.separator) {
      const separator = document.createElement("div");
      separator.style.cssText = `
        width: 1px;
        height: 24px;
        background: #ddd;
        margin: 0 4px;
      `;
      goalsContainer.appendChild(separator);
    } else {
      const goalBtn = document.createElement("button");
      goalBtn.textContent = item.text;
      goalBtn.title = "Generate message for this goal";
      goalBtn.style.cssText = `
        background: #fff3e0;
        border: 1px solid #ff9800;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        color: #e65100;
        white-space: nowrap;
      `;
      goalBtn.onclick = () => {
        generateAISuggestion(inputField, item.key);
      };
      goalsContainer.appendChild(goalBtn);
    }
  });

  // Append goals container to body
  document.body.appendChild(goalsContainer);
}

// Show intention modal to ask buyer what they want to achieve
function showIntentionModal(inputField) {
  // Remove existing modal if any
  const existingModal = document.querySelector(".intention-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal overlay
  const modal = document.createElement("div");
  modal.className = "intention-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  `;

  // Get all intentions
  const allIntentions = [
    { key: "get_better_price", text: "Get better price/discount" },
    { key: "request_samples", text: "Request free samples" },
    { key: "ask_specifications", text: "Ask for product specifications" },
    { key: "request_moq", text: "Negotiate minimum order quantity" },
    { key: "other", text: "General response" },
  ];

  // Add custom goals
  const customGoals = getCustomGoals();
  if (customGoals.length > 0) {
    customGoals.forEach((goal) => {
      allIntentions.push({
        key: `custom_${goal.id}`,
        text: goal.text,
        custom: true,
      });
    });
  }

  // Build modal HTML
  let modalHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333; flex-shrink: 0;">What do you want to achieve?</h3>
    <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1;">`;

  allIntentions.forEach((intention) => {
    const emoji =
      intention.key === "get_better_price"
        ? "💰"
        : intention.key === "request_samples"
        ? "📦"
        : intention.key === "ask_specifications"
        ? "📋"
        : intention.key === "request_moq"
        ? "📊"
        : intention.key === "other"
        ? "💬"
        : "🎯";
    const className = intention.custom
      ? "intention-option custom-goal"
      : "intention-option";
    modalHTML += `<button class="${className}" data-intention="${intention.key}">${emoji} ${intention.text}</button>`;
  });

  // Add custom goal input section
  modalHTML += `
      <div id="custom-goal-section" style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; display: none;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500;">➕ Add Custom Goal:</div>
        <input type="text" id="custom-goal-input" placeholder="Enter your goal..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; box-sizing: border-box;" maxlength="100">
        <div style="display: flex; gap: 8px;">
          <button id="add-custom-goal-btn" style="flex: 1; padding: 6px 12px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Goal</button>
          <button id="cancel-custom-goal-btn" style="padding: 6px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </div>
      <button id="show-custom-goal-section" style="width: 100%; padding: 8px; background: #e3f2fd; color: #1976d2; border: 1px solid #2196f3; border-radius: 4px; cursor: pointer; margin-top: 10px;">➕ Add custom goal...</button>
    </div>
    <button id="cancel-intention" style="margin-top: 15px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0;">Cancel</button>
  `;

  modalContent.innerHTML = modalHTML;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Add styles for intention options
  const style = document.createElement("style");
  style.textContent = `
    .intention-option {
      padding: 10px 15px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      transition: all 0.3s ease;
    }
    .intention-option:hover {
      background: #e3f2fd;
      border-color: #2196f3;
    }
    .custom-goal {
      background: #fff3e0 !important;
      border-color: #ff9800 !important;
    }
    .custom-goal:hover {
      background: #ffe0b2 !important;
    }
  `;
  document.head.appendChild(style);

  // Get references to elements
  const customGoalSection = modalContent.querySelector("#custom-goal-section");
  const showCustomSectionBtn = modalContent.querySelector(
    "#show-custom-goal-section"
  );
  const customGoalInput = modalContent.querySelector("#custom-goal-input");
  const addCustomGoalBtn = modalContent.querySelector("#add-custom-goal-btn");
  const cancelCustomGoalBtn = modalContent.querySelector(
    "#cancel-custom-goal-btn"
  );

  // Handle showing custom goal input section
  if (showCustomSectionBtn) {
    showCustomSectionBtn.addEventListener("click", () => {
      if (customGoalSection) {
        customGoalSection.style.display = "block";
        showCustomSectionBtn.style.display = "none";
        if (customGoalInput) customGoalInput.focus();
      }
    });
  }

  // Handle canceling custom goal input
  if (cancelCustomGoalBtn) {
    cancelCustomGoalBtn.addEventListener("click", () => {
      if (customGoalSection) {
        customGoalSection.style.display = "none";
        if (showCustomSectionBtn) showCustomSectionBtn.style.display = "block";
        if (customGoalInput) customGoalInput.value = "";
      }
    });
  }

  // Handle adding custom goal
  if (addCustomGoalBtn) {
    addCustomGoalBtn.addEventListener("click", () => {
      if (customGoalInput) {
        const goalText = customGoalInput.value.trim();
        if (!goalText) return;

        if (addCustomGoal(goalText)) {
          // Success - refresh modal
          modal.remove();
          showIntentionModal(inputField);
          showBookmarkNotification("Custom goal added! 🎯", "#4caf50");
        } else {
          // Check what went wrong
          const existingGoals = getCustomGoals();
          if (existingGoals.length >= 10) {
            showBookmarkNotification(
              "Maximum 10 custom goals allowed!",
              "#f44336"
            );
          } else {
            showBookmarkNotification("Goal already exists!", "#ff9800");
          }
        }
      }
    });
  }

  // Handle Enter key in input
  if (customGoalInput) {
    customGoalInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        if (addCustomGoalBtn) addCustomGoalBtn.click();
      }
    });
  }

  // Handle intention selection and custom goal deletion
  modalContent.addEventListener("click", (e) => {
    if (e.target.classList.contains("intention-option")) {
      const intention = e.target.dataset.intention;

      // Handle custom goals
      if (intention.startsWith("custom_")) {
        const goalId = intention.replace("custom_", "");
        incrementGoalUsage(goalId);
      }

      modal.remove();
      generateAISuggestion(inputField, intention);
    } else if (e.target.id === "cancel-intention") {
      modal.remove();
    }
  });

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
// Setup observer for new messages
function setupMessageObserver() {
  const observer = new MutationObserver((mutations) => {
    let hasNewMessages = false;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (
            node.classList &&
            (node.classList.contains("seller-msg") ||
              node.classList.contains("user-msg"))
          ) {
            hasNewMessages = true;
          }
          // Check child elements too
          const allMsgs = node.querySelectorAll
            ? node.querySelectorAll(".seller-msg, .user-msg")
            : [];
          if (allMsgs.length > 0) {
            hasNewMessages = true;
          }
        }
      });
    });

    if (hasNewMessages) {
      setTimeout(() => {
        scanForSellerMessages();
        scanForBuyerMessages();
        addIntentionButtons(); // Ensure intention buttons are added to new messages
        addAutoNegotiationButtons(); // Ensure auto-negotiation buttons are added to new messages
      }, 500);
    }
  });

  const chatContainer =
    document.getElementById("chat-messages") || document.body;
  observer.observe(chatContainer, {
    childList: true,
    subtree: true,
  });
}

// Generate AI suggestion based on conversation history and intention
function generateAISuggestion(inputField, intention) {
  // Handle custom goals
  let actualIntention = intention;
  if (intention.startsWith("custom_")) {
    const goalId = intention.replace("custom_", "");
    const customGoals = getCustomGoals();
    const customGoal = customGoals.find((g) => g.id === goalId);
    if (customGoal) {
      actualIntention = customGoal.text;
    }
  }

  // Collect last 2 messages from conversation
  const messages = [];
  const messageElements = document.querySelectorAll(".seller-msg, .user-msg");

  // Get the last 2 messages (most recent first)
  for (
    let i = messageElements.length - 1;
    i >= Math.max(0, messageElements.length - 2);
    i--
  ) {
    const el = messageElements[i];
    const content = el.querySelector(".message-content");
    if (content) {
      const textNode = Array.from(content.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      if (textNode) {
        const type = el.classList.contains("seller-msg") ? "seller" : "buyer";
        messages.unshift({
          text: textNode.textContent.trim(),
          type: type,
        });
      }
    } else {
      // If no message-content div, extract only text nodes excluding overlays
      const originalText = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join("")
        .trim();

      if (originalText) {
        const type = el.classList.contains("seller-msg") ? "seller" : "buyer";
        messages.unshift({
          text: originalText,
          type: type,
        });
      }
    }
  }

  // Send to background script for AI processing
  try {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          action: "generate_smart_suggestion",
          messages: messages,
          intention: actualIntention,
        },
        (response) => {
          if (response && response.suggestions) {
            showSmartSuggestions(response.suggestions, inputField);
          } else {
            console.error("Failed to get AI suggestions");
          }
        }
      );
    } else {
      console.warn(
        "Chrome runtime not available - extension may have been reloaded"
      );
    }
  } catch (error) {
    console.error("Extension context invalidated:", error);
    // Show user-friendly message
    alert(
      "Extension was reloaded. Please refresh the page to continue using AI suggestions."
    );
  }
}

// Show smart suggestions with bilingual display
function showSmartSuggestions(suggestions, inputField) {
  const container = document.getElementById("suggestions-container");
  if (!container) return;

  container.innerHTML = "";

  if (suggestions && suggestions.length > 0) {
    // Add header with close button
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      font-size: 12px;
      font-weight: 500;
      color: #666;
    `;

    const title = document.createElement("span");
    title.textContent = "💡 AI Suggestions";
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.title = "Close suggestions";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #999;
      padding: 2px 6px;
      border-radius: 3px;
      transition: all 0.2s ease;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = "#e0e0e0";
      closeBtn.style.color = "#666";
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = "none";
      closeBtn.style.color = "#999";
    };
    closeBtn.onclick = () => {
      container.style.display = "none";
    };
    header.appendChild(closeBtn);

    container.appendChild(header);

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.className = "smart-suggestion-item";
      item.style.cssText = `
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
        border: 1px solid #2196f3;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;

      // Chinese text and copy button
      const chinesePart = document.createElement("div");
      chinesePart.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const chineseText = document.createElement("span");
      chineseText.textContent = suggestion.chinese;
      chineseText.style.cssText = `
        flex: 1;
        font-weight: 500;
        color: #1565c0;
      `;

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "📋";
      copyBtn.title = "Copy to input";
      copyBtn.style.cssText = `
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
      `;

      copyBtn.onclick = () => {
        inputField.value = suggestion.chinese;
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
        container.style.display = "none";
      };

      chinesePart.appendChild(chineseText);
      chinesePart.appendChild(copyBtn);
      item.appendChild(chinesePart);

      // Translation section
      const translationPart = document.createElement("div");
      translationPart.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 8px;
        border-left: 2px solid #e3f2fd;
      `;

      // Always show English translation
      if (suggestion.english) {
        const englishText = document.createElement("div");
        englishText.textContent = `🇺🇸 ${suggestion.english}`;
        englishText.style.cssText = `
          font-size: 13px;
          color: #424242;
          font-style: italic;
        `;
        translationPart.appendChild(englishText);
      }

      // Show buyer's language translation if different from English
      const buyerLanguageKey = Object.keys(suggestion).find(
        (key) => key !== "chinese" && key !== "english"
      );
      if (
        buyerLanguageKey &&
        suggestion[buyerLanguageKey] &&
        suggestion[buyerLanguageKey] !== suggestion.english
      ) {
        const buyerText = document.createElement("div");
        const flagEmoji = buyerLanguageKey === "bn" ? "🇧🇩" : "🌐";
        buyerText.textContent = `${flagEmoji} ${suggestion[buyerLanguageKey]}`;
        buyerText.style.cssText = `
          font-size: 13px;
          color: #d32f2f;
          font-style: italic;
        `;
        translationPart.appendChild(buyerText);
      }

      item.appendChild(translationPart);
      container.appendChild(item);
    });

    container.style.display = "block";

    // Add escape key to close
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        container.style.display = "none";
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };

    // Add event listener after a short delay to avoid immediate closing
    setTimeout(() => {
      document.addEventListener("keydown", handleEscapeKey);
    }, 100);
  }
}

// Initialize when DOM is ready
function init() {
  // Prevent double initialization
  if (window.aiTradeAssistantInitialized) return;
  window.aiTradeAssistantInitialized = true;

  console.log("Initializing AI Trade Assistant...");

  // Initial scan
  setTimeout(() => {
    scanForSellerMessages();
    scanForBuyerMessages();
  }, 1000);

  // Setup input field
  setupInputField();

  // Setup observer for new messages
  setupMessageObserver();
}

// Wait for page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Also watch for dynamic content
setTimeout(init, 2000);

// Expose functions globally for testing
window.startAutoNegotiation = startAutoNegotiation;
window.showNegotiationSimulation = showNegotiationSimulation;
window.runNegotiationSimulation = runNegotiationSimulation;
window.generateBuyerResponse = generateBuyerResponse;
window.generateSellerResponse = generateSellerResponse;
window.shouldEndNegotiation = shouldEndNegotiation;
window.analyzeNegotiationResult = analyzeNegotiationResult;
