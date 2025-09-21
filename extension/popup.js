// Popup script for 1688 Chat Translator
document.addEventListener("DOMContentLoaded", function () {
  const testBtn = document.getElementById("test-btn");
  const currentPageEl = document.getElementById("current-page");
  const apiKeyInput = document.getElementById("api-key-input");
  const modelSelect = document.getElementById("model-select");
  const saveApiKeyBtn = document.getElementById("save-api-key");
  const saveStatus = document.getElementById("save-status");

  // Load saved settings on popup open
  chrome.storage.sync.get(["groqApiKey", "groqModel"], function (result) {
    if (result.groqApiKey) {
      apiKeyInput.value = result.groqApiKey;
    }
    if (result.groqModel) {
      modelSelect.value = result.groqModel;
    }
  });

  // Save settings functionality
  saveApiKeyBtn.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;

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
