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
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Create and add a floating summary button to the right center of the screen
function addSummaryButton() {
  // Check if button already exists
  if (document.getElementById('ai-summary-button')) return;
  
  const summaryButton = document.createElement('button');
  summaryButton.id = 'ai-summary-button';
  summaryButton.textContent = '📝';
  summaryButton.title = 'Generate AI conversation summary';
  summaryButton.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196F3, #3F51B5);
    color: white;
    border: none;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    font-size: 20px;
    cursor: pointer;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  
  // Add hover effects
  summaryButton.onmouseover = () => {
    summaryButton.style.transform = 'translateY(-50%) scale(1.1)';
    summaryButton.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
  };
  
  summaryButton.onmouseout = () => {
    summaryButton.style.transform = 'translateY(-50%)';
    summaryButton.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
  };
  
  // Add click event
  summaryButton.onclick = showSummaryModal;
  
  document.body.appendChild(summaryButton);
}

// Call the function to add the summary button when content script loads
addSummaryButton();

// Create and display the summary modal
function showSummaryModal() {
  // Check if modal already exists and remove it
  const existingModal = document.getElementById('ai-summary-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'ai-summary-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    animation: fadeIn 0.3s ease;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: white;
    width: 80%;
    max-width: 650px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    padding: 25px;
    position: relative;
    animation: scaleIn 0.3s ease;
    border: 1px solid rgba(33, 150, 243, 0.3);
    background: linear-gradient(to bottom, #ffffff, #f7f9fc);
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(33, 150, 243, 0.2);
    padding-bottom: 15px;
  `;
  
  // Add title
  const title = document.createElement('h3');
  title.innerHTML = '📝 <span style="background: linear-gradient(45deg, #2196F3, #3F51B5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Conversation Summary</span>';
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;
  
  // Create a container for the buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  // Add copy button
  const copyButton = document.createElement('button');
  copyButton.innerHTML = '📋';
  copyButton.title = 'Copy summary to clipboard';
  copyButton.id = 'ai-summary-copy-btn';
  copyButton.style.cssText = `
    background: linear-gradient(45deg, #4CAF50, #8BC34A);
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
  `;
  
  // Add hover effects for copy button
  copyButton.onmouseover = () => {
    copyButton.style.transform = 'scale(1.1)';
    copyButton.style.boxShadow = '0 3px 7px rgba(0,0,0,0.3)';
  };
  
  copyButton.onmouseout = () => {
    copyButton.style.transform = 'scale(1)';
    copyButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  };
  
  // Add click event for copy button
  copyButton.onclick = () => {
    copySummaryToClipboard();
  };
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    background: linear-gradient(45deg, #ff6b35, #ff9d5c);
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
  `;
  
  // Add hover effects for close button
  closeButton.onmouseover = () => {
    closeButton.style.transform = 'scale(1.1)';
    closeButton.style.boxShadow = '0 3px 7px rgba(0,0,0,0.3)';
  };
  
  closeButton.onmouseout = () => {
    closeButton.style.transform = 'scale(1)';
    closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  };
  closeButton.onclick = () => {
    modal.remove();
  };
  
  // Add content area
  const contentArea = document.createElement('div');
  contentArea.id = 'ai-summary-content';
  contentArea.style.cssText = `
    padding: 15px;
    margin-bottom: 20px;
    min-height: 150px;
    max-height: 450px;
    overflow-y: auto;
    border: 1px solid rgba(33, 150, 243, 0.2);
    border-radius: 12px;
    background-color: rgba(249, 251, 255, 0.8);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #2196F3 #f1f1f1;
  `;
  
  // Add custom scrollbar styling
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `
    #ai-summary-content::-webkit-scrollbar {
      width: 8px;
    }
    
    #ai-summary-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    #ai-summary-content::-webkit-scrollbar-thumb {
      background: linear-gradient(45deg, #2196F3, #3F51B5);
      border-radius: 10px;
    }
    
    #ai-summary-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(45deg, #1976D2, #303F9F);
    }
  `;
  document.head.appendChild(scrollbarStyle);
  
  // Add enhanced loading spinner initially
  const loadingSpinner = document.createElement('div');
  loadingSpinner.style.cssText = `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 150px;
  `;
  loadingSpinner.innerHTML = `
    <div style="
      position: relative;
      width: 70px;
      height: 70px;
      margin-bottom: 15px;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 4px solid transparent;
        border-top-color: #2196F3;
        border-radius: 50%;
        animation: spinnerOne 1.2s linear infinite;
      "></div>
      <div style="
        position: absolute;
        top: 5px;
        left: 5px;
        right: 5px;
        bottom: 5px;
        border: 4px solid transparent;
        border-top-color: #3F51B5;
        border-radius: 50%;
        animation: spinnerTwo 0.8s linear infinite;
      "></div>
      <div style="
        position: absolute;
        top: 15px;
        left: 15px;
        right: 15px;
        bottom: 15px;
        border: 4px solid transparent;
        border-top-color: #FF6B35;
        border-radius: 50%;
        animation: spinnerThree 0.6s linear infinite;
      "></div>
    </div>
    <div style="
      color: #2196F3;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 500;
      font-size: 16px;
      text-align: center;
    ">Generating summary<span class="loading-dots">...</span></div>
    <style>
      @keyframes spinnerOne {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes spinnerTwo {
        0% { transform: rotate(60deg); }
        100% { transform: rotate(420deg); }
      }
      @keyframes spinnerThree {
        0% { transform: rotate(120deg); }
        100% { transform: rotate(480deg); }
      }
      @keyframes loadingDots {
        0% { content: "."; }
        33% { content: ".."; }
        66% { content: "..."; }
        100% { content: ""; }
      }
      .loading-dots {
        display: inline-block;
        animation: loadingDots 1.5s infinite;
      }
    </style>
  `;
  contentArea.appendChild(loadingSpinner);
  
  // Assemble modal
  header.appendChild(title);
  buttonsContainer.appendChild(copyButton);
  buttonsContainer.appendChild(closeButton);
  header.appendChild(buttonsContainer);
  modalContent.appendChild(header);
  modalContent.appendChild(contentArea);
  modal.appendChild(modalContent);
  
  // Add modal to document
  document.body.appendChild(modal);
  
  // Generate summary
  generateConversationSummary();
}

// Function to copy the summary to clipboard
function copySummaryToClipboard() {
  // Find the summary container
  const summaryContainer = document.querySelector('.summary-container');
  if (!summaryContainer) return;
  
  try {
    // Extract text from the summary container (removing HTML tags)
    const summaryText = summaryContainer.innerText || summaryContainer.textContent;
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(summaryText).then(() => {
      // Show success notification
      showCopyNotification('Summary copied to clipboard! 📋', '#4CAF50');
      
      // Change the copy button to show success
      const copyButton = document.getElementById('ai-summary-copy-btn');
      if (copyButton) {
        const originalInnerHTML = copyButton.innerHTML;
        const originalBackground = copyButton.style.background;
        
        // Change to checkmark and success color
        copyButton.innerHTML = '✓';
        copyButton.style.background = 'linear-gradient(45deg, #4CAF50, #4CAF50)';
        
        // Revert after a delay
        setTimeout(() => {
          copyButton.innerHTML = originalInnerHTML;
          copyButton.style.background = originalBackground;
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showCopyNotification('Failed to copy summary', '#F44336');
    });
  } catch (error) {
    console.error('Copy error:', error);
    showCopyNotification('Failed to copy summary', '#F44336');
  }
}

// Function to show copy notification
function showCopyNotification(message, backgroundColor) {
  // Check if there's already a notification
  const existingNotification = document.getElementById('ai-summary-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'ai-summary-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${backgroundColor};
    color: white;
    padding: 10px 20px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    z-index: 10002;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    align-items: center;
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(20px)';
    
    // Remove from DOM after fade out
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Function to extract the last 10 conversation messages
function extractConversationMessages() {
  const messages = [];
  
  // Get all seller and buyer messages on the page
  const sellerMessages = document.querySelectorAll('.seller-msg');
  const buyerMessages = document.querySelectorAll('.user-msg');
  
  // Combine all messages and sort them by their position in the DOM
  const allMessages = [...sellerMessages, ...buyerMessages];
  
  // Sort messages based on their position in the DOM to get chronological order
  allMessages.sort((a, b) => {
    // Use node comparison for DOM position
    if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else {
      return 1;
    }
  });
  
  // Get the last 10 messages (or fewer if there aren't 10)
  const lastMessages = allMessages.slice(-10);
  
  // Extract text and sender type for each message
  lastMessages.forEach(msg => {
    // Extract original text only, not including translation overlays
    const text = Array.from(msg.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join('')
      .trim();
    
    // Determine if this is a seller or buyer message
    const isSeller = msg.classList.contains('seller-msg');
    
    messages.push({
      text: text,
      sender: isSeller ? 'seller' : 'buyer'
    });
  });
  
  return messages;
}

// Function to generate AI-based summary of conversation
async function generateConversationSummary() {
  try {
    // Extract conversation messages
    const messages = extractConversationMessages();
    
    if (messages.length === 0) {
      // Handle case where no messages are found
      updateSummaryContent('No conversation messages found. Please make sure you have some messages in the chat.');
      return;
    }
    
    // Get buyer language from storage
    const result = await chrome.storage.sync.get(['buyerLanguage']);
    const buyerLanguage = result.buyerLanguage || 'en';
    
    // Send messages to background script for AI summarization
    chrome.runtime.sendMessage(
      {
        action: 'generate_conversation_summary',
        messages: messages,
        targetLanguage: buyerLanguage
      },
      (response) => {
        if (response.error) {
          // Handle error
          updateSummaryContent(`Error generating summary: ${response.error}`, true);
        } else if (response.summary) {
          // Display the summary
          updateSummaryContent(response.summary);
        }
      }
    );
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    updateSummaryContent(`Error: ${error.message}`, true);
  }
}

// Function to update the summary content in the modal
function updateSummaryContent(content, isError = false) {
  const contentArea = document.getElementById('ai-summary-content');
  if (!contentArea) return;
  
  // Clear the loading spinner
  contentArea.innerHTML = '';
  
  // Create content container
  const container = document.createElement('div');
  container.style.cssText = `
    padding: 15px;
    ${isError ? 'color: #f44336;' : ''}
  `;
  
  // Store the original plain text content as a data attribute for copying
  if (!isError) {
    container.dataset.plainText = content;
  }
  
  // Add content
  if (isError) {
    // Show error message
    container.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="color: #f44336; margin-right: 10px; font-size: 24px;">⚠️</div>
        <div>${content}</div>
      </div>
      <div style="font-size: 13px; color: #666; margin-top: 10px;">
        Please check your API settings in the extension popup.
      </div>
    `;
  } else {
    // Process the content to add visual enhancements
    let enhancedContent = content;
    
    // Add styling to bullet points and numbers
    enhancedContent = enhancedContent
      // Style numbered lists (1. 2. 3. etc)
      .replace(/(\d+\.\s)([^\n]+)/g, '<div class="summary-point"><span class="summary-number">$1</span>$2</div>')
      // Style bullet points
      .replace(/(\•|\-|\*)\s([^\n]+)/g, '<div class="summary-point"><span class="summary-bullet">•</span>$2</div>')
      // Style section headers (lines ending with colon)
      .replace(/([^\n:]+):(\s*(?:\n|$))/g, '<h3 class="summary-section">$1:</h3>$2')
      // Add paragraph styling
      .replace(/\n\n/g, '</p><p>');
    
    // Show summary content with enhanced formatting
    container.innerHTML = `
      <style>
        .summary-container {
          font-size: 15px;
          line-height: 1.6;
          color: #333;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          padding: 20px;
        }
        
        .summary-header {
          font-weight: 600;
          font-size: 16px;
          color: #2196F3;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        
        .summary-icon {
          margin-right: 10px;
          font-size: 22px;
        }
        
        .summary-section {
          font-size: 16px;
          font-weight: 600;
          color: #3F51B5;
          margin-top: 15px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(63, 81, 181, 0.2);
          padding-bottom: 5px;
        }
        
        .summary-point {
          display: flex;
          margin: 8px 0;
          align-items: baseline;
        }
        
        .summary-bullet {
          color: #FF6B35;
          font-size: 18px;
          margin-right: 10px;
          flex-shrink: 0;
        }
        
        .summary-number {
          color: #FF6B35;
          font-weight: 600;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        p {
          margin: 10px 0;
        }
        
        strong, b {
          color: #333;
          font-weight: 600;
        }
      </style>
      <div class="summary-container">
        <div class="summary-header">
          <span class="summary-icon">🔍</span>
          <span>Conversation Summary</span>
        </div>
        <p>${enhancedContent}</p>
      </div>
    `;
  }
  
  contentArea.appendChild(container);
}

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

  // Create unified translate button (combines language toggle + translation)
  const translateBtn = document.createElement("button");
  translateBtn.className = "translate-btn";
  translateBtn.textContent = "EN 中";
  translateBtn.title = "Click to translate (EN mode) | Right-click to toggle language";
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
      translateBtn.title = "Click to translate (English mode) | Right-click to switch to Banglish";
      translateBtn.style.background = "linear-gradient(135deg, #ff6b35, #ff8c42)";
      translateBtn.style.boxShadow = "0 2px 4px rgba(255, 107, 53, 0.3)";
    } else {
      translateBtn.textContent = "BN 中";
      translateBtn.title = "Click to translate (Banglish mode) | Right-click to switch to English";
      translateBtn.style.background = "linear-gradient(135deg, #A0522D, #8B4513)";
      translateBtn.style.boxShadow = "0 2px 4px rgba(160, 82, 45, 0.3)";
    }
  }

  translateBtn.onmouseover = () => {
    const scale = currentLanguage === "en" ? 1.05 : 1.05;
    translateBtn.style.transform = `translateY(-50%) scale(${scale})`;
    translateBtn.style.boxShadow = currentLanguage === "en" 
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
