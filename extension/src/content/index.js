// Content script for AI Trade Assistant

console.log("AI Trade Assistant content script loaded");

let apiKey = null;
let targetLanguage = "bn";

// Load settings from storage
chrome.storage.sync.get(["apiKey", "language"], (result) => {
  apiKey = result.apiKey || null;
  targetLanguage = result.language || "bn";
});

// Function to translate text using Google Translate (unofficial API)
async function translateText(text, from = "zh-CN", to = targetLanguage) {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    } else {
      console.error("Translation API error:", data);
      return text;
    }
  } catch (error) {
    console.error("Translation error:", error);
    return text; // fallback to original
  }
}

// Function to add translation overlay
function addTranslationOverlay(element, translatedText) {
  const overlay = document.createElement("div");
  overlay.className = "translation-overlay";
  overlay.style.cssText = `
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 3px;
    font-size: 12px;
    color: #333;
    z-index: 1000;
    max-width: 200px;
  `;
  overlay.textContent = translatedText;
  element.style.position = "relative";
  element.appendChild(overlay);
}

// Observe for new seller messages
function observeMessages() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const sellerMsgs = node.querySelectorAll(".seller-msg");
          sellerMsgs.forEach(async (msg) => {
            const text = msg.textContent;
            if (text && !msg.hasAttribute("data-translated")) {
              const translated = await translateText(text);
              addTranslationOverlay(msg, translated);
              msg.setAttribute("data-translated", "true");
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeMessages);
} else {
  observeMessages();
}

// TODO: Add AI suggestion logic for input field
