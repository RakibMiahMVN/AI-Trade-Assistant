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

  overlay.onclick = () => {
    overlay.style.display = overlay.style.display === "none" ? "block" : "none";
  };

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

// Add intention analysis buttons to the last 3 seller messages
function addIntentionButtons() {
  const allSellerMessages = document.querySelectorAll(".seller-msg");
  if (allSellerMessages.length === 0) return;

  // Get the last 3 seller messages
  const lastThreeSellerMessages = Array.from(allSellerMessages).slice(-3);

  lastThreeSellerMessages.forEach((msgElement) => {
    // Check if button already exists
    if (msgElement.parentNode.querySelector(".intention-btn")) return;

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
      analyzeSellerIntention(msgElement);
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
    messageContent.appendChild(intentionBtn);
  });
}

// Bookmark a buyer message
async function bookmarkMessage(messageElement) {
  // Extract only the original text, excluding translation overlays
  const originalText = Array.from(messageElement.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .join('')
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
  // Extract only the original text, excluding translation overlays
  const messageText = Array.from(messageElement.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .join('')
    .trim();

  if (!messageText) return;

  try {
    // Send to background script for AI analysis
    const response = await chrome.runtime.sendMessage({
      action: "analyze_intention",
      text: messageText,
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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  modalContent.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333;">What do you want to achieve?</h3>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button class="intention-option" data-intention="get_better_price">💰 Get better price/discount</button>
      <button class="intention-option" data-intention="request_samples">📦 Request free samples</button>
      <button class="intention-option" data-intention="negotiate_terms">📋 Negotiate payment terms</button>
      <button class="intention-option" data-intention="ask_specifications">📋 Ask for product specifications</button>
      <button class="intention-option" data-intention="request_moq">📊 Negotiate minimum order quantity</button>
      <button class="intention-option" data-intention="other">❓ Other goal</button>
    </div>
    <button id="cancel-intention" style="margin-top: 15px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
  `;

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
  `;
  document.head.appendChild(style);

  // Handle intention selection
  modalContent.addEventListener("click", (e) => {
    if (e.target.classList.contains("intention-option")) {
      const intention = e.target.dataset.intention;
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
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join('')
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
          intention: intention,
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
        align-items: center;
        gap: 10px;
      `;

      // Chinese text and copy button
      const chinesePart = document.createElement("div");
      chinesePart.style.cssText = `
        flex: 1;
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

      // Get buyer's language text (dynamic key)
      const buyerLanguageText = Object.keys(suggestion).find(
        (key) => key !== "chinese"
      );
      const translatedText =
        suggestion[buyerLanguageText] || suggestion.chinese;

      // Translated text in buyer's language
      const translatedTextSpan = document.createElement("span");
      translatedTextSpan.textContent = translatedText;
      translatedTextSpan.style.cssText = `
        flex: 1;
        font-size: 13px;
        color: #666;
        font-style: italic;
      `;

      chinesePart.appendChild(chineseText);
      chinesePart.appendChild(copyBtn);
      item.appendChild(chinesePart);
      item.appendChild(translatedTextSpan);
      container.appendChild(item);
    });

    container.style.display = "block";
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
