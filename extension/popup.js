// Popup script for 1688 Chat Translator
document.addEventListener("DOMContentLoaded", function () {
  const testBtn = document.getElementById("test-btn");
  const currentPageEl = document.getElementById("current-page");
  const apiKeyInput = document.getElementById("api-key-input");
  const modelSelect = document.getElementById("model-select");
  const buyerLanguageSelect = document.getElementById("buyer-language-select");
  const saveApiKeyBtn = document.getElementById("save-api-key");
  const saveStatus = document.getElementById("save-status");

  // Bookmarks elements
  const refreshBookmarksBtn = document.getElementById("refresh-bookmarks");
  const bookmarksContainer = document.getElementById("bookmarks-container");
  const bookmarksList = document.getElementById("bookmarks-list");
  const noBookmarksMsg = document.getElementById("no-bookmarks");

  // Load saved settings on popup open
  chrome.storage.sync.get(
    ["groqApiKey", "groqModel", "buyerLanguage"],
    function (result) {
      if (result.groqApiKey) {
        apiKeyInput.value = result.groqApiKey;
      }
      if (result.groqModel) {
        modelSelect.value = result.groqModel;
      }
      if (result.buyerLanguage) {
        buyerLanguageSelect.value = result.buyerLanguage;
      } else {
        // Default to English if not set
        buyerLanguageSelect.value = "en";
      }
    }
  );

  // Load bookmarks when popup opens
  loadBookmarks();

  // Refresh bookmarks button
  refreshBookmarksBtn.addEventListener("click", function () {
    loadBookmarks();
  });

  // Function to load bookmarks from active tab
  function loadBookmarks() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (!currentTab) return;

      // Execute script to get bookmarks from localStorage
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          function: () => {
            try {
              const bookmarks = localStorage.getItem(
                "aiTradeAssistantBookmarks"
              );
              return bookmarks ? JSON.parse(bookmarks) : [];
            } catch (error) {
              console.error("Error accessing bookmarks:", error);
              return [];
            }
          },
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            displayBookmarks(results[0].result);
          } else {
            displayBookmarks([]);
          }
        }
      );
    });
  }

  // Function to display bookmarks
  function displayBookmarks(bookmarks) {
    bookmarksList.innerHTML = "";

    if (!bookmarks || bookmarks.length === 0) {
      noBookmarksMsg.style.display = "block";
      return;
    }

    noBookmarksMsg.style.display = "none";

    // Sort bookmarks by creation date (newest first)
    bookmarks.sort((a, b) => new Date(b.created) - new Date(a.created));

    bookmarks.forEach((bookmark) => {
      const bookmarkItem = document.createElement("div");
      bookmarkItem.className = "bookmark-item";
      bookmarkItem.style.cssText = `
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        position: relative;
      `;

      // Header with language indicator and delete button
      const header = document.createElement("div");
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      `;

      const langIndicator = document.createElement("span");
      const flagEmoji =
        bookmark.buyerLanguage === "bn"
          ? "🇧🇩"
          : bookmark.buyerLanguage === "en"
          ? "🇺🇸"
          : "🌐";
      langIndicator.textContent = `${flagEmoji} ${bookmark.buyerLanguage.toUpperCase()}`;
      langIndicator.style.cssText = `
        font-size: 10px;
        color: #666;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 10px;
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.title = "Delete bookmark";
      deleteBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 2px;
        opacity: 0.6;
      `;
      deleteBtn.onmouseover = () => (deleteBtn.style.opacity = "1");
      deleteBtn.onmouseout = () => (deleteBtn.style.opacity = "0.6");
      deleteBtn.onclick = () => deleteBookmark(bookmark.id);

      header.appendChild(langIndicator);
      header.appendChild(deleteBtn);

      // Translated text (display text)
      const translatedText = document.createElement("div");
      translatedText.textContent =
        bookmark.translatedText || bookmark.originalText;
      translatedText.style.cssText = `
        font-size: 13px;
        color: #1565c0;
        margin-bottom: 6px;
        font-weight: 500;
      `;

      // Original text (Chinese)
      const originalText = document.createElement("div");
      originalText.textContent = bookmark.originalText;
      originalText.style.cssText = `
        font-size: 12px;
        color: #666;
        font-style: italic;
        border-top: 1px solid #f0f0f0;
        padding-top: 6px;
      `;

      // Creation date
      const dateText = document.createElement("div");
      const createdDate = new Date(bookmark.created);
      dateText.textContent =
        createdDate.toLocaleDateString() +
        " " +
        createdDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      dateText.style.cssText = `
        font-size: 10px;
        color: #999;
        text-align: right;
        margin-top: 4px;
      `;

      bookmarkItem.appendChild(header);
      bookmarkItem.appendChild(translatedText);
      bookmarkItem.appendChild(originalText);
      bookmarkItem.appendChild(dateText);

      bookmarksList.appendChild(bookmarkItem);
    });
  }

  // Function to delete a bookmark
  function deleteBookmark(bookmarkId) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (!currentTab) return;

      // Execute script to delete bookmark from localStorage
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          function: (id) => {
            try {
              const bookmarks = localStorage.getItem(
                "aiTradeAssistantBookmarks"
              );
              if (bookmarks) {
                let bookmarksArray = JSON.parse(bookmarks);
                bookmarksArray = bookmarksArray.filter((b) => b.id !== id);
                localStorage.setItem(
                  "aiTradeAssistantBookmarks",
                  JSON.stringify(bookmarksArray)
                );
                return bookmarksArray;
              }
              return [];
            } catch (error) {
              console.error("Error deleting bookmark:", error);
              return [];
            }
          },
          args: [bookmarkId],
        },
        (results) => {
          if (results && results[0] && results[0].result !== undefined) {
            displayBookmarks(results[0].result);
          } else {
            loadBookmarks(); // Fallback: reload all bookmarks
          }
        }
      );
    });
  }

  // Load saved settings on popup open
  chrome.storage.sync.get(
    ["groqApiKey", "groqModel", "buyerLanguage"],
    function (result) {
      if (result.groqApiKey) {
        apiKeyInput.value = result.groqApiKey;
      }
      if (result.groqModel) {
        modelSelect.value = result.groqModel;
      }
      if (result.buyerLanguage) {
        buyerLanguageSelect.value = result.buyerLanguage;
      } else {
        // Default to English if not set
        buyerLanguageSelect.value = "en";
      }
    }
  );

  // Save settings functionality
  saveApiKeyBtn.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const buyerLanguage = buyerLanguageSelect.value;

    if (!apiKey) {
      saveStatus.textContent = "Please enter an API key";
      saveStatus.style.color = "#f44336";
      return;
    }

    if (!apiKey.startsWith("gsk_")) {
      saveStatus.textContent = "API key should start with 'gsk_'";
      saveStatus.style.color = "#f44336";
      return;
    }

    chrome.storage.sync.set(
      {
        groqApiKey: apiKey,
        groqModel: model,
        buyerLanguage: buyerLanguage,
      },
      function () {
        saveStatus.textContent = "Settings saved successfully!";
        saveStatus.style.color = "#4CAF50";

        // Clear status after 3 seconds
        setTimeout(() => {
          saveStatus.textContent = "";
        }, 3000);
      }
    );
  });

  // Update current page info
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (currentTab) {
      const url = new URL(currentTab.url);
      if (url.protocol === "file:" && url.pathname.includes("demo.html")) {
        currentPageEl.textContent = "Demo Page";
        currentPageEl.className = "status-value active";
      } else if (url.hostname.includes("1688.com")) {
        currentPageEl.textContent = "1688.com";
        currentPageEl.className = "status-value active";
      } else {
        currentPageEl.textContent = "Other Page";
        currentPageEl.className = "status-value inactive";
      }
    }
  });

  // Test button functionality
  testBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      if (currentTab.url.includes("demo.html")) {
        // Reload the demo page to trigger content script
        chrome.tabs.reload(currentTab.id);
        testBtn.textContent = "Testing...";
        testBtn.disabled = true;

        setTimeout(() => {
          testBtn.textContent = "Test Complete";
          setTimeout(() => {
            testBtn.textContent = "Test on Demo Page";
            testBtn.disabled = false;
          }, 2000);
        }, 2000);
      } else {
        alert("Please navigate to the demo.html page to test the extension.");
      }
    });
  });
});
