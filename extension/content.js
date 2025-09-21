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
          
          // Store the message in conversation history
          storeMessage(chineseText, "seller");
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  // Add intention analysis buttons to the last 3 seller messages
  addIntentionButtons();
}

// Detect buyer messages and add translation overlays
function getBuyerMessages() {
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
          
          // Store the original buyer message in conversation history
          storeMessage(buyerText, "buyer");
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

  // Create translate button
  const translateBtn = document.createElement("button");
  translateBtn.className = "translate-btn";
  translateBtn.textContent = "中";
  translateBtn.title = "Translate to Chinese";
  translateBtn.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #ff6b35;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
  `;

  translateBtn.onmouseover = () => {
    translateBtn.style.background = "#e55a2b";
  };

  translateBtn.onmouseout = () => {
    translateBtn.style.background = "#ff6b35";
  };

  translateBtn.onclick = async () => {
    const text = inputField.value.trim();
    if (!text) return;

    try {
      // Show loading state
      translateBtn.textContent = "...";
      translateBtn.disabled = true;

      // Request translation from background script
      const response = await chrome.runtime.sendMessage({
        action: "translate",
        text: text,
        from: "en",
        to: "zh",
      });
      if (response.translation) {
        inputField.value = response.translation;
        // Trigger input event to update any listeners
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      // Reset button
      translateBtn.textContent = "中";
      translateBtn.disabled = false;
    }
  };

  // Create suggested reply button
  const suggestBtn = document.createElement("button");
  suggestBtn.className = "suggest-btn";
  suggestBtn.textContent = "💡";
  suggestBtn.title = "Get AI Suggestion";
  suggestBtn.style.cssText = `
    position: absolute;
    right: 45px;
    top: 50%;
    transform: translateY(-50%);
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
  `;

  suggestBtn.onmouseover = () => {
    suggestBtn.style.background = "#1976d2";
  };

  suggestBtn.onmouseout = () => {
    suggestBtn.style.background = "#2196f3";
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
  inputField.style.paddingRight = "90px";
  inputField.style.overflow = "hidden";

  // Insert buttons and suggestions container into the wrapper
  inputWrapper.appendChild(suggestBtn);
  inputWrapper.appendChild(translateBtn);
  inputWrapper.appendChild(suggestionsContainer);
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

  // Get custom goals
  const customGoals = getCustomGoals();

  // Build modal HTML
  let modalHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333; flex-shrink: 0;">What do you want to achieve?</h3>
    <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1;">
      <button class="intention-option" data-intention="get_better_price">💰 Get better price/discount</button>
      <button class="intention-option" data-intention="request_samples">📦 Request free samples</button>
      <button class="intention-option" data-intention="ask_specifications">📋 Ask for product specifications</button>
      <button class="intention-option" data-intention="request_moq">📊 Negotiate minimum order quantity</button>
      <button class="intention-option" data-intention="other">💬 General response</button>`;

  // Add custom goals section if any exist
  if (customGoals.length > 0) {
    modalHTML += `<div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500;">⭐️ Your Custom Goals:</div>`;

    customGoals.forEach((goal) => {
      modalHTML += `
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="intention-option custom-goal" data-intention="custom_${goal.id}" style="flex: 1;">
            🎯 ${goal.text}
          </button>
          <button class="delete-goal-btn" data-goal-id="${goal.id}" title="Delete this goal" style="background: #f44336; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>`;
    });

    modalHTML += `</div>`;
  }

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
  showCustomSectionBtn.addEventListener("click", () => {
    customGoalSection.style.display = "block";
    showCustomSectionBtn.style.display = "none";
    customGoalInput.focus();
  });

  // Handle canceling custom goal input
  cancelCustomGoalBtn.addEventListener("click", () => {
    customGoalSection.style.display = "none";
    showCustomSectionBtn.style.display = "block";
    customGoalInput.value = "";
  });

  // Handle adding custom goal
  addCustomGoalBtn.addEventListener("click", () => {
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
        showBookmarkNotification("Maximum 10 custom goals allowed!", "#f44336");
      } else {
        showBookmarkNotification("Goal already exists!", "#ff9800");
      }
    }
  });

  // Handle Enter key in input
  customGoalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addCustomGoalBtn.click();
    }
  });

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
    } else if (e.target.classList.contains("delete-goal-btn")) {
      e.stopPropagation();
      const goalId = e.target.dataset.goalId;
      deleteCustomGoal(goalId);
      // Refresh modal
      modal.remove();
      showIntentionModal(inputField);
      showBookmarkNotification("Custom goal deleted!", "#ff9800");
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
        getBuyerMessages();
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

    // Add click outside to close
    const handleClickOutside = (event) => {
      if (!container.contains(event.target) && event.target !== inputField) {
        container.style.display = "none";
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        container.style.display = "none";
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };

    // Add event listeners after a short delay to avoid immediate closing
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }, 100);
  }
}

// Message storage and tracking for conversation summaries
let conversationHistory = [];

// Store message when it's processed
function storeMessage(text, type) {
  const message = {
    text: text,
    type: type, // 'seller' or 'buyer'
    timestamp: new Date().toISOString()
  };
  
  conversationHistory.push(message);
  
  // Keep only last 20 messages to prevent memory issues
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
  
  console.log(`Stored ${type} message. Total messages: ${conversationHistory.length}`);
}

// Get conversation history for summarization
function getConversationHistory() {
  return conversationHistory;
}

// Create and inject notes button beside send button
function injectNotesButton() {
  // Remove any existing notes buttons first
  const existingButtons = document.querySelectorAll('.notes-btn');
  if (existingButtons.length > 0) {
    existingButtons.forEach(btn => btn.remove());
    console.log(`Removed ${existingButtons.length} existing notes buttons`);
  }
  
  // Always create floating button in right-center position
  console.log("Creating floating notes button in right-center position");
  injectFloatingNotesButton();
}

// Helper function to inject notes button into input container
function injectNotesButtonToContainer(container) {
  // Always create floating button instead of inline button
  console.log("Container found, but creating floating button instead");
  injectFloatingNotesButton();
}

// Fallback function for floating notes button
function injectFloatingNotesButton() {
  // Remove any existing notes buttons (including inline ones)
  const existingButtons = document.querySelectorAll('.notes-btn');
  existingButtons.forEach(btn => btn.remove());
  
  const notesBtn = document.createElement('button');
  notesBtn.className = 'notes-btn';
  notesBtn.innerHTML = '📝';
  notesBtn.title = 'Take Notes & Summarize (Last 20 Messages)';
  notesBtn.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #4CAF50;
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    z-index: 10000;
    transition: all 0.3s ease;
  `;
  
  notesBtn.onmouseover = () => {
    notesBtn.style.transform = 'translateY(-50%) scale(1.1)';
    notesBtn.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
  };
  
  notesBtn.onmouseout = () => {
    notesBtn.style.transform = 'translateY(-50%) scale(1)';
    notesBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
  };
  
  notesBtn.onclick = async () => {
    await showNotesModal();
  };
  
  document.body.appendChild(notesBtn);
  console.log("Floating notes button injected at right-center position");
}

// Show notes modal with automatic summarization
async function showNotesModal() {
  // Remove existing modal if present
  const existingModal = document.querySelector('.notes-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'notes-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 700px;
    max-height: 80%;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  // Modal header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 15px;
  `;
  
  const title = document.createElement('h2');
  title.textContent = '📝 AI Notes & Summary';
  title.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 24px;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 5px;
  `;
  closeBtn.onclick = () => modal.remove();
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Tab navigation
  const tabContainer = document.createElement('div');
  tabContainer.style.cssText = `
    margin-bottom: 20px;
    display: flex;
    border-bottom: 2px solid #f0f0f0;
  `;
  
  // Tab buttons
  const autoSummaryTab = document.createElement('button');
  autoSummaryTab.className = 'tab-btn active-tab';
  autoSummaryTab.textContent = '🤖 Generate Auto Summary';
  autoSummaryTab.style.cssText = `
    flex: 1;
    padding: 12px 20px;
    border: none;
    background: #4CAF50;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px 6px 0 0;
    margin-right: 2px;
    transition: all 0.3s ease;
  `;
  
  const viewNotesTab = document.createElement('button');
  viewNotesTab.className = 'tab-btn';
  viewNotesTab.textContent = '👀 View Notes';
  viewNotesTab.style.cssText = `
    flex: 1;
    padding: 12px 20px;
    border: none;
    background: #e0e0e0;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px 6px 0 0;
    transition: all 0.3s ease;
  `;
  
  tabContainer.appendChild(autoSummaryTab);
  tabContainer.appendChild(viewNotesTab);
  
  // Content area with action buttons
  const content = document.createElement('div');
  content.innerHTML = `
    <div id="action-buttons" style="margin-bottom: 20px; display: flex; gap: 10px;">
      <button id="copy-summary-btn" style="
        background: #2196F3;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 8px;
      ">📋 Copy Summary</button>
      <button id="refresh-summary-btn" style="
        background: #FF9800;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 8px;
      ">🔄 Refresh Summary</button>
    </div>
    <div id="summary-content" style="
      min-height: 200px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
      border: 1px solid #ddd;
      position: relative;
    ">
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 40px; margin-bottom: 20px;">🤖</div>
        <p>Generating AI summary of last 20 messages...</p>
        <div style="margin-top: 20px;">
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
      </div>
    </div>
  `;
  
  modalContent.appendChild(header);
  modalContent.appendChild(tabContainer);
  modalContent.appendChild(content);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .tab-btn:hover {
      opacity: 0.8;
    }
    .active-tab {
      background: #4CAF50 !important;
      color: white !important;
    }
    .inactive-tab {
      background: #e0e0e0 !important;
      color: #666 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Get elements
  const copySummaryBtn = content.querySelector('#copy-summary-btn');
  const refreshSummaryBtn = content.querySelector('#refresh-summary-btn');
  const summaryContent = content.querySelector('#summary-content');
  const actionButtons = content.querySelector('#action-buttons');
  
  // Tab switching functionality
  function switchToAutoSummary() {
    autoSummaryTab.className = 'tab-btn active-tab';
    viewNotesTab.className = 'tab-btn inactive-tab';
    
    // Show summary action buttons
    actionButtons.style.display = 'flex';
    
    // Generate auto summary if content is empty or shows notes
    if (summaryContent.innerHTML.includes('Saved Notes') || summaryContent.innerHTML.includes('No saved notes')) {
      generateAutoSummary(summaryContent, copySummaryBtn);
    }
  }
  
  function switchToViewNotes() {
    autoSummaryTab.className = 'tab-btn inactive-tab';
    viewNotesTab.className = 'tab-btn active-tab';
    
    // Hide summary action buttons for notes view
    actionButtons.style.display = 'none';
    
    // Load saved notes
    loadSavedNotes(summaryContent);
  }
  
  // Add tab click handlers
  autoSummaryTab.onclick = switchToAutoSummary;
  viewNotesTab.onclick = switchToViewNotes;
  
  // Add action button handlers
  copySummaryBtn.onclick = async () => {
    await copySummaryToClipboard(summaryContent);
  };
  
  refreshSummaryBtn.onclick = async () => {
    // Prevent multiple simultaneous refreshes
    if (refreshSummaryBtn.disabled) {
      return;
    }
    
    // Show loading state
    refreshSummaryBtn.disabled = true;
    refreshSummaryBtn.innerHTML = '⏳ Refreshing...';
    refreshSummaryBtn.style.opacity = '0.7';
    
    // Also disable copy button during refresh
    copySummaryBtn.disabled = true;
    copySummaryBtn.style.opacity = '0.5';
    
    // Show loading in content area
    summaryContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
        <h3>Refreshing Summary...</h3>
        <p>Generating fresh analysis of the last 20 messages</p>
        <div style="margin-top: 15px; color: #999; font-size: 14px;">This may take a few moments...</div>
      </div>
    `;
    
    try {
      await generateAutoSummary(summaryContent, copySummaryBtn, true);
    } catch (error) {
      console.error('Refresh summary error:', error);
    } finally {
      // Restore button states
      refreshSummaryBtn.disabled = false;
      refreshSummaryBtn.innerHTML = '🔄 Refresh Summary';
      refreshSummaryBtn.style.opacity = '1';
      
      // Copy button will be re-enabled by generateAutoSummary if successful
    }
  };
  
  // Close modal on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  // Auto-generate summary on modal open (default tab is already active)
  await generateAutoSummary(summaryContent, copySummaryBtn);
}

// Automatically generate summary with last 20 messages
async function generateAutoSummary(contentDiv, copyBtn, isRefresh = false) {
  try {
    // Show initial loading state if not already shown (for auto-generation)
    if (!isRefresh) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
          <h3>Generating Summary...</h3>
          <p>Analyzing the last 20 messages from your conversation</p>
        </div>
      `;
    }
    
    const filteredMessages = getFilteredMessages('messages', '20');
    console.log(`Generating auto-summary for ${filteredMessages.length} messages:`, filteredMessages);
    
    // Check if extension context is available
    if (!chrome.runtime?.id) {
      throw new Error("Extension was reloaded. Please refresh the page to continue using AI features.");
    }
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: "summarize_conversation",
        messages: filteredMessages,
        summaryType: 'messages',
        summaryValue: '20'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    displaySummary(contentDiv, response.summary, 'messages', '20');
    
    // Enable copy button
    copyBtn.disabled = false;
    copyBtn.style.opacity = '1';
    
    // Show success feedback for refresh
    if (isRefresh) {
      // Briefly show success message
      const originalContent = contentDiv.innerHTML;
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #4CAF50; background: #e8f5e8; border-radius: 6px; margin-bottom: 15px;">
          <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
          <strong>Summary Refreshed Successfully!</strong>
        </div>
      ` + originalContent;
      
      // Remove success message after 2 seconds
      setTimeout(() => {
        const successMsg = contentDiv.querySelector('div[style*="background: #e8f5e8"]');
        if (successMsg) {
          successMsg.remove();
        }
      }, 2000);
    }
    
  } catch (error) {
    console.error('Auto-summarization error:', error);
    contentDiv.innerHTML = `
      <div style="color: #f44336; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h3>Summarization Failed</h3>
        <p>Error: ${error.message}</p>
        <p style="color: #666; margin-top: 15px;">
          Make sure your Groq API key is configured in the extension settings.
        </p>
        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; color: #856404;">
          <strong>Filter Applied:</strong> Last 20 Messages
        </div>
        <button onclick="location.reload()" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 15px;
        ">🔄 Refresh Page</button>
      </div>
    `;
    
    // Disable copy button on error
    copyBtn.disabled = true;
    copyBtn.style.opacity = '0.5';
  }
}

// Copy summary to clipboard
async function copySummaryToClipboard(summaryContent) {
  try {
    const summaryText = summaryContent.innerText || summaryContent.textContent;
    
    if (!summaryText || summaryText.includes('Generating AI summary') || summaryText.includes('Summarization Failed')) {
      alert('No summary available to copy. Please wait for the summary to generate successfully.');
      return;
    }
    
    await navigator.clipboard.writeText(summaryText);
    
    // Show success feedback
    const originalBtn = document.querySelector('#copy-summary-btn');
    if (originalBtn) {
      const originalText = originalBtn.textContent;
      originalBtn.textContent = '✅ Copied!';
      originalBtn.style.background = '#4CAF50';
      
      setTimeout(() => {
        originalBtn.textContent = originalText;
        originalBtn.style.background = '#2196F3';
      }, 2000);
    }
    
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    
    // Fallback: create a temporary textarea for older browsers
    try {
      const summaryText = summaryContent.innerText || summaryContent.textContent;
      const textarea = document.createElement('textarea');
      textarea.value = summaryText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      alert('Summary copied to clipboard!');
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      alert('Failed to copy to clipboard. Please select and copy the text manually.');
    }
  }
}

// Generate conversation summary with dynamic options
async function generateDynamicSummary(contentDiv, button, type, value) {
  const originalText = button.textContent;
  const originalBg = button.style.background;
  button.textContent = '🔄 Processing...';
  button.style.background = '#666';
  button.disabled = true;
  
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 40px; margin-bottom: 20px;">🤖</div>
      <p>Analyzing conversation with AI...</p>
      <p style="color: #666; font-size: 14px;">Type: ${type}, Filter: ${value}</p>
      <div style="margin-top: 20px;">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  try {
    const filteredMessages = getFilteredMessages(type, value);
    console.log(`Sending ${filteredMessages.length} messages for ${type} summarization:`, filteredMessages);
    
    const response = await chrome.runtime.sendMessage({
      action: "summarize_conversation",
      messages: filteredMessages,
      summaryType: type,
      summaryValue: value
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    displaySummary(contentDiv, response.summary, type, value);
    
  } catch (error) {
    console.error('Summarization error:', error);
    contentDiv.innerHTML = `
      <div style="color: #f44336; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h3>Summarization Failed</h3>
        <p>Error: ${error.message}</p>
        <p style="color: #666; margin-top: 15px;">
          Make sure your Groq API key is configured in the extension settings.
        </p>
        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; color: #856404;">
          <strong>Filter Applied:</strong> ${type} - ${value}
        </div>
      </div>
    `;
  } finally {
    button.textContent = originalText;
    button.style.background = originalBg;
    button.disabled = false;
  }
}

// Get filtered messages based on type and value
function getFilteredMessages(type, value) {
  const allMessages = getConversationHistory();
  
  switch (type) {
    case 'messages':
      // Filter by number of messages
      const messageCount = parseInt(value);
      return allMessages.slice(-messageCount);
      
    case 'time':
      // Filter by time (in minutes)
      const minutesAgo = parseInt(value);
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
      return allMessages.filter(msg => new Date(msg.timestamp) >= cutoffTime);
      
    case 'topic':
      // Filter by topic/keyword
      return filterMessagesByTopic(allMessages, value);
      
    case 'all':
      // Return all messages
      return allMessages;
      
    default:
      // Default to last 10 messages
      return allMessages.slice(-10);
  }
}

// Filter messages by topic/keywords
function filterMessagesByTopic(messages, topic) {
  const topicKeywords = {
    'product': [
      // English keywords
      'product', 'specification', 'quality', 'material', 'size', 'color', 'model', 'feature', 'design',
      'dimension', 'weight', 'capacity', 'performance', 'function', 'style', 'brand', 'version',
      // Chinese keywords
      '产品', '规格', '质量', '材料', '尺寸', '颜色', '型号', '功能', '设计',
      '尺寸', '重量', '容量', '性能', '款式', '品牌', '版本', '材质'
    ],
    'price': [
      // English keywords
      'price', 'cost', 'fee', 'charge', 'rate', 'discount', 'offer', 'quote', 'budget', 'cheap',
      'expensive', 'affordable', 'negotiate', 'deal', 'payment', 'money', 'dollar', 'yuan',
      // Chinese keywords
      '价格', '费用', '收费', '报价', '优惠', '折扣', '便宜', '贵', '谈价', '付款',
      '钱', '元', '美元', '成本', '预算', '划算'
    ],
    'shipping': [
      // English keywords
      'shipping', 'delivery', 'transport', 'logistics', 'freight', 'courier', 'express', 'ship',
      'send', 'dispatch', 'lead time', 'arrival', 'port', 'customs', 'duty', 'tax',
      // Chinese keywords
      '运输', '发货', '快递', '物流', '运费', '邮寄', '发送', '到达',
      '港口', '海关', '关税', '交货', '运输时间'
    ]
  };
  
  const keywords = topicKeywords[topic] || [];
  
  if (keywords.length === 0) {
    return messages; // Return all messages if no keywords found
  }
  
  return messages.filter(msg => {
    const text = msg.text.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  });
}

// Generate conversation summary (keeping original for compatibility)
async function generateSummary(contentDiv, button) {
  const originalText = button.textContent;
  button.textContent = '🔄 Generating...';
  button.disabled = true;
  
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 40px; margin-bottom: 20px;">🤖</div>
      <p>Analyzing conversation with AI...</p>
      <div style="margin-top: 20px;">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  try {
    const messages = getConversationHistory();
    console.log('Sending messages for summarization:', messages.length);
    
    const response = await chrome.runtime.sendMessage({
      action: "summarize_conversation",
      messages: messages
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    displaySummary(contentDiv, response.summary);
    
  } catch (error) {
    console.error('Summarization error:', error);
    contentDiv.innerHTML = `
      <div style="color: #f44336; text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h3>Summarization Failed</h3>
        <p>Error: ${error.message}</p>
        <p style="color: #666; margin-top: 15px;">
          Make sure your Groq API key is configured in the extension settings.
        </p>
      </div>
    `;
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

// Display the generated summary
function displaySummary(contentDiv, summary, type = 'messages', value = '10') {
  const date = new Date(summary.timestamp).toLocaleString();
  
  // Create filter description
  let filterDescription = '';
  switch (type) {
    case 'messages':
      filterDescription = `📝 Last ${value} Messages`;
      break;
    case 'time':
      const timeLabel = value == 30 ? '30 Minutes' : value == 60 ? '1 Hour' : value == 1440 ? 'Today' : `${value} Minutes`;
      filterDescription = `⏰ ${timeLabel}`;
      break;
    case 'topic':
      const topicLabel = value == 'product' ? '🏭 Product Details' : value == 'price' ? '💰 Price Discussion' : value == 'shipping' ? '🚚 Shipping & Terms' : `📂 ${value}`;
      filterDescription = topicLabel;
      break;
    case 'all':
      filterDescription = '📋 Complete Conversation';
      break;
    default:
      filterDescription = `📝 ${type} - ${value}`;
  }
  
  contentDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="color: #4CAF50; margin: 0;">📊 Conversation Summary</h3>
        <button id="save-summary-btn" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='#1976D2'; this.style.transform='scale(1.02)'" onmouseout="this.style.background='#2196F3'; this.style.transform='scale(1)'">
          💾 Save to Notes
        </button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Generated: ${date}
        </p>
        <div style="
          background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #1976d2;
          font-weight: 500;
          border: 1px solid #e1bee7;
        ">
          ${filterDescription}
        </div>
      </div>
      <p style="color: #666; font-size: 14px; margin: 0;">
        Messages Analyzed: ${summary.messageCount || 'N/A'}
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #333; margin: 0 0 10px 0;">📝 Overview</h4>
      <p style="line-height: 1.6; color: #555;">${summary.summary}</p>
    </div>
    
    ${summary.keyPoints && summary.keyPoints.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #333; margin: 0 0 10px 0;">🔑 Key Points</h4>
        <ul style="padding-left: 20px;">
          ${summary.keyPoints.map(point => `<li style="margin-bottom: 8px; line-height: 1.5;">${point}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${summary.nextSteps ? `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #333; margin: 0 0 10px 0;">➡️ Next Steps</h4>
        <p style="line-height: 1.6; color: #555;">${summary.nextSteps}</p>
      </div>
    ` : ''}
    
    ${summary.dealStatus ? `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #333; margin: 0 0 10px 0;">📈 Deal Status</h4>
        <p style="line-height: 1.6; color: #555; 
           padding: 10px; 
           background: #e8f5e8; 
           border-radius: 6px; 
           border-left: 4px solid #4CAF50;">
          ${summary.dealStatus}
        </p>
      </div>
    ` : ''}
    
    ${type === 'topic' ? `
      <div style="
        margin-top: 20px;
        padding: 12px;
        background: linear-gradient(135deg, #fff3e0, #fce4ec);
        border-radius: 8px;
        border-left: 4px solid #ff9800;
      ">
        <h4 style="color: #e65100; margin: 0 0 8px 0;">🎯 Topic-Focused Analysis</h4>
        <p style="color: #bf360c; font-size: 14px; margin: 0; line-height: 1.4;">
          This summary focuses specifically on <strong>${value}</strong> related discussions. 
          For a complete conversation overview, try "Complete Conversation" option.
        </p>
      </div>
    ` : ''}
  `;
  
  // Add event listener for save button
  const saveBtn = contentDiv.querySelector('#save-summary-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Show loading state
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;
        saveBtn.style.background = '#666';
        
        // Create storage data
        const summaryKey = `summary_${Date.now()}`;
        const storageData = {};
        storageData[summaryKey] = {
          ...summary,
          type: type,
          value: value,
          summaryType: type,
          summaryValue: value
        };
        
        // Save to Chrome storage
        await new Promise((resolve, reject) => {
          chrome.storage.local.set(storageData, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log(`Manual summary saved with key: ${summaryKey}`);
              resolve();
            }
          });
        });
        
        // Show success feedback
        saveBtn.textContent = '✅ Saved!';
        saveBtn.style.background = '#4CAF50';
        
        // Reset button after 2 seconds
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#2196F3';
          saveBtn.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error('Error saving summary:', error);
        
        // Show error feedback
        saveBtn.textContent = '❌ Error!';
        saveBtn.style.background = '#f44336';
        
        // Reset button after 2 seconds
        setTimeout(() => {
          saveBtn.textContent = '💾 Save to Notes';
          saveBtn.style.background = '#2196F3';
          saveBtn.disabled = false;
        }, 2000);
      }
    });
  }
}

// Load and display saved notes
async function loadSavedNotes(contentDiv) {
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 40px; margin-bottom: 20px;">📚</div>
      <p>Loading saved notes...</p>
    </div>
  `;
  
  try {
    chrome.storage.local.get(null, (result) => {
      const summaries = Object.keys(result)
        .filter(key => key.startsWith('summary_'))
        .map(key => ({ key, ...result[key] }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (summaries.length === 0) {
        contentDiv.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
            <h3>No Saved Notes</h3>
            <p>Generate your first conversation summary to see it here!</p>
          </div>
        `;
        return;
      }
      
      const notesHtml = summaries.map(summary => {
        const date = new Date(summary.timestamp).toLocaleString();
        
        // Create filter badge
        let filterBadge = '';
        if (summary.summaryType && summary.summaryValue) {
          const type = summary.summaryType;
          const value = summary.summaryValue;
          let filterText = '';
          let badgeColor = '#2196F3';
          
          switch (type) {
            case 'messages':
              filterText = `📝 ${value} msgs`;
              badgeColor = '#4CAF50';
              break;
            case 'time':
              const timeLabel = value == 30 ? '30min' : value == 60 ? '1hr' : value == 1440 ? 'today' : `${value}min`;
              filterText = `⏰ ${timeLabel}`;
              badgeColor = '#FF9800';
              break;
            case 'topic':
              const topicLabel = value == 'product' ? '🏭 product' : value == 'price' ? '💰 price' : value == 'shipping' ? '🚚 shipping' : value;
              filterText = topicLabel;
              badgeColor = '#9C27B0';
              break;
            case 'all':
              filterText = '📋 complete';
              badgeColor = '#F44336';
              break;
            default:
              filterText = `${type}-${value}`;
          }
          
          filterBadge = `
            <span style="
              background: ${badgeColor};
              color: white;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 10px;
              margin-left: 8px;
            ">${filterText}</span>
          `;
        }
        
        return `
          <div style="
            border: 1px solid #ddd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px;
            background: white;
          ">
            <div style="
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin-bottom: 10px;
            ">
              <div style="display: flex; align-items: center;">
                <h4 style="margin: 0; color: #333;">📊 ${date}</h4>
                ${filterBadge}
              </div>
              <button class="delete-note-btn" data-key="${summary.key}" style="
                background: #f44336;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s ease;
              " onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">Delete</button>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              Messages: ${summary.messageCount || 'N/A'}
            </p>
            <p style="line-height: 1.5; margin-bottom: 10px;">${summary.summary}</p>
            ${summary.dealStatus ? `
              <div style="
                background: #e8f5e8; 
                padding: 8px; 
                border-radius: 4px; 
                border-left: 3px solid #4CAF50;
                font-size: 14px;
              ">
                <strong>Status:</strong> ${summary.dealStatus}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      
      contentDiv.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: #2196F3; margin: 0;">📚 Saved Notes (${summaries.length})</h3>
          <button id="delete-all-notes-btn" style="
            background: #FF5722;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.3s ease;
          " onmouseover="this.style.background='#E64A19'" onmouseout="this.style.background='#FF5722'">🗑️ Delete All</button>
        </div>
        ${notesHtml}
      `;
      
      // Add delete button event listeners
      const deleteButtons = contentDiv.querySelectorAll('.delete-note-btn');
      deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const key = button.getAttribute('data-key');
          const confirmDelete = confirm('Are you sure you want to delete this note?');
          
          if (confirmDelete && key) {
            try {
              // Delete from Chrome storage
              await new Promise((resolve) => {
                chrome.storage.local.remove([key], () => {
                  console.log(`Deleted note with key: ${key}`);
                  resolve();
                });
              });
              
              // Show success feedback
              button.textContent = 'Deleted!';
              button.style.background = '#4CAF50';
              button.disabled = true;
              
              // Refresh the notes list after a short delay
              setTimeout(() => {
                loadSavedNotes(contentDiv);
              }, 1000);
              
            } catch (error) {
              console.error('Error deleting note:', error);
              button.textContent = 'Error!';
              button.style.background = '#FF5722';
              
              // Reset button after 2 seconds
              setTimeout(() => {
                button.textContent = 'Delete';
                button.style.background = '#f44336';
                button.disabled = false;
              }, 2000);
            }
          }
        });
      });
      
      // Add delete all button event listener
      const deleteAllBtn = contentDiv.querySelector('#delete-all-notes-btn');
      if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const confirmDeleteAll = confirm(`Are you sure you want to delete ALL ${summaries.length} saved notes? This action cannot be undone.`);
          
          if (confirmDeleteAll) {
            try {
              // Get all summary keys
              const keysToDelete = summaries.map(s => s.key);
              
              // Delete all from Chrome storage
              await new Promise((resolve) => {
                chrome.storage.local.remove(keysToDelete, () => {
                  console.log(`Deleted ${keysToDelete.length} notes`);
                  resolve();
                });
              });
              
              // Show success feedback
              deleteAllBtn.textContent = '✅ All Deleted!';
              deleteAllBtn.style.background = '#4CAF50';
              deleteAllBtn.disabled = true;
              
              // Refresh the notes list after a short delay
              setTimeout(() => {
                loadSavedNotes(contentDiv);
              }, 1500);
              
            } catch (error) {
              console.error('Error deleting all notes:', error);
              deleteAllBtn.textContent = 'Error!';
              deleteAllBtn.style.background = '#F44336';
              
              // Reset button after 2 seconds
              setTimeout(() => {
                deleteAllBtn.textContent = '🗑️ Delete All';
                deleteAllBtn.style.background = '#FF5722';
                deleteAllBtn.disabled = false;
              }, 2000);
            }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error loading saved notes:', error);
    contentDiv.innerHTML = `
      <div style="color: #f44336; text-align: center; padding: 20px;">
        <h3>Error Loading Notes</h3>
        <p>${error.message}</p>
      </div>
    `;
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
    getBuyerMessages();
  }, 1000);

  // Setup input field
  setupInputField();

  // Setup observer for new messages
  setupMessageObserver();
  
  // Inject notes button
  injectNotesButton();
  
  // Set up periodic check for notes button (useful for SPAs and dynamic content)
  setInterval(() => {
    if (!document.querySelector('.notes-btn')) {
      console.log("Notes button not found, re-injecting...");
      injectNotesButton();
    }
  }, 3000); // Check every 3 seconds
}

// Wait for page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Also watch for dynamic content
setTimeout(init, 2000);
