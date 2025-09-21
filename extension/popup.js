// Popup script for 1688 Chat Translator
document.addEventListener("DOMContentLoaded", function () {
  const testBtn = document.getElementById("test-btn");
  const currentPageEl = document.getElementById("current-page");
  const apiKeyInput = document.getElementById("api-key-input");
  const modelSelect = document.getElementById("model-select");
  const saveApiKeyBtn = document.getElementById("save-api-key");
  const saveStatus = document.getElementById("save-status");
  const viewNotesBtn = document.getElementById("view-notes-btn");
  const clearNotesBtn = document.getElementById("clear-notes-btn");
  const notesLoading = document.getElementById("notes-loading");
  const notesContent = document.getElementById("notes-content");

  // Load saved settings on popup open
  chrome.storage.sync.get(["groqApiKey", "groqModel"], function (result) {
    if (result.groqApiKey) {
      apiKeyInput.value = result.groqApiKey;
    }
    if (result.groqModel) {
      modelSelect.value = result.groqModel;
    }
  });

  // Load notes summary
  loadNotesSummary();

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

  // Notes management
  viewNotesBtn.addEventListener("click", function () {
    // Open a new tab or window to display notes
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html') + '?view=notes',
      active: true
    });
  });

  clearNotesBtn.addEventListener("click", function () {
    if (confirm("Are you sure you want to delete all saved conversation notes?")) {
      chrome.storage.local.clear(() => {
        console.log("All notes cleared");
        loadNotesSummary();
        
        // Show confirmation
        const originalText = clearNotesBtn.textContent;
        clearNotesBtn.textContent = "Cleared!";
        clearNotesBtn.style.background = "#4CAF50";
        
        setTimeout(() => {
          clearNotesBtn.textContent = originalText;
          clearNotesBtn.style.background = "#f44336";
        }, 2000);
      });
    }
  });

  // Load and display notes summary
  function loadNotesSummary() {
    chrome.storage.local.get(null, (result) => {
      const summaries = Object.keys(result)
        .filter(key => key.startsWith('summary_'))
        .map(key => result[key])
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      notesLoading.style.display = 'none';
      notesContent.style.display = 'block';
      
      if (summaries.length === 0) {
        notesContent.innerHTML = `
          <div style="text-align: center; color: #999;">
            <div style="font-size: 16px; margin-bottom: 5px;">📝</div>
            <div>No notes saved yet</div>
          </div>
        `;
      } else {
        const latestSummary = summaries[0];
        const date = new Date(latestSummary.timestamp).toLocaleDateString();
        
        notesContent.innerHTML = `
          <div style="margin-bottom: 8px;">
            <strong style="color: #4CAF50;">${summaries.length} saved note${summaries.length > 1 ? 's' : ''}</strong>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #999;">Latest: ${date}</div>
            <div style="font-size: 11px; line-height: 1.4; margin-top: 4px;">
              ${latestSummary.summary ? latestSummary.summary.substring(0, 100) + '...' : 'Summary unavailable'}
            </div>
          </div>
          ${latestSummary.dealStatus ? `
            <div style="
              background: #e8f5e8; 
              padding: 4px 6px; 
              border-radius: 3px; 
              font-size: 10px; 
              color: #2e7d32;
              border-left: 2px solid #4CAF50;
            ">
              Status: ${latestSummary.dealStatus}
            </div>
          ` : ''}
        `;
      }
    });
  }
});
