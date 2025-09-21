// Content script for AI Trade Assistant
console.log("AI Trade Assistant content script loaded");

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
        // Request translation from background script
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: chineseText,
          from: "zh",
          to: "bn",
        });

        if (response.translation) {
          console.log("Seller translation result:", response.translation);
          addTranslationOverlay(msgElement, response.translation, "seller");
          msgElement.classList.add("translated");
          
          // Store the message in conversation history
          storeMessage(chineseText, "seller");
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });
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
        // Request translation from background script
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: buyerText,
          from: "zh",
          to: "bn",
        });

        if (response.translation) {
          console.log("Buyer translation result:", response.translation);
          addTranslationOverlay(msgElement, response.translation, "buyer");
          msgElement.classList.add("translated");
          
          // Store the original buyer message in conversation history
          storeMessage(buyerText, "buyer");
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });
}

// Add translation overlay to message
function addTranslationOverlay(messageElement, translation, type = "seller") {
  const overlay = document.createElement("div");
  overlay.className = `translation-overlay ${type}-translation`;

  if (type === "buyer") {
    // Buyer messages: show Chinese translation with blue styling
    overlay.textContent = `🇨🇳 ${translation}`;
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
    // Seller messages: show Bengali translation with orange styling
    overlay.textContent = `🇧🇩 ${translation}`;
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

// Detect input field and add suggestion functionality
function setupInputField() {
  const chatInput = document.getElementById("chat-input");
  if (!chatInput) return;

  // Add translate and suggestion buttons next to input
  injectTranslateButton(chatInput);

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

  // Replace input field with wrapper, then put input field inside wrapper
  inputField.parentNode.insertBefore(inputWrapper, inputField);
  inputWrapper.appendChild(inputField);
  inputField.style.flex = "1";
  inputField.style.paddingRight = "90px";

  // Insert buttons into the wrapper
  inputWrapper.appendChild(suggestBtn);
  inputWrapper.appendChild(translateBtn);
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
  // Collect last 2 messages from conversation
  const messages = [];
  const messageElements = document.querySelectorAll(".message");

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
        const type = el.classList.contains("seller-message")
          ? "seller"
          : "buyer";
        messages.unshift({
          text: textNode.textContent.trim(),
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

      // Bengali text
      const bengaliText = document.createElement("span");
      bengaliText.textContent = suggestion.bengali;
      bengaliText.style.cssText = `
        flex: 1;
        font-size: 13px;
        color: #666;
        font-style: italic;
      `;

      chinesePart.appendChild(chineseText);
      chinesePart.appendChild(copyBtn);
      item.appendChild(chinesePart);
      item.appendChild(bengaliText);
      container.appendChild(item);
    });

    container.style.display = "block";
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
    await generateAutoSummary(summaryContent, copySummaryBtn);
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
async function generateAutoSummary(contentDiv, copyBtn) {
  try {
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
