import React from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [apiKey, setApiKey] = React.useState("");
  const [language, setLanguage] = React.useState("bn");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    // Load saved settings
    chrome.storage.sync.get(["apiKey", "language"], (result) => {
      setApiKey(result.apiKey || "");
      setLanguage(result.language || "bn");
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.sync.set({ apiKey, language }, () => {
      setStatus("Settings saved!");
      setTimeout(() => setStatus(""), 2000);
    });
  };

  return (
    <div
      style={{
        width: "300px",
        padding: "10px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h3>AI Trade Assistant Settings</h3>
      <div style={{ margin: "10px 0" }}>
        <label
          htmlFor="api-key"
          style={{ display: "block", marginBottom: "5px" }}
        >
          API Key (for translations):
        </label>
        <input
          type="password"
          id="api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key"
          style={{ width: "100%", padding: "5px" }}
        />
      </div>
      <div style={{ margin: "10px 0" }}>
        <label
          htmlFor="language"
          style={{ display: "block", marginBottom: "5px" }}
        >
          Target Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ width: "100%", padding: "5px" }}
        >
          <option value="bn">Bengali</option>
          <option value="en">English</option>
        </select>
      </div>
      <button
        onClick={saveSettings}
        style={{ padding: "5px 10px", marginTop: "10px" }}
      >
        Save Settings
      </button>
      <div>{status}</div>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Popup />);
