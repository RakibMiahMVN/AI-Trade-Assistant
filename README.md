# AI Trade Assistant

A powerful browser extension that revolutionizes international trade communication by providing real-time translation and AI-powered response suggestions for buyers communicating with Chinese sellers on platforms like 1688.com.

## 🌟 Features

### 🔄 Real-Time Translation

- **Automatic Message Translation**: Instantly translates seller messages from Chinese to Bengali
- **Buyer Message Translation**: Translates buyer messages from English to Chinese
- **Smart Overlays**: Clickable translation bubbles that can be toggled on/off
- **Fallback Support**: Uses MyMemory API as backup when Google Translate is unavailable

### 🤖 AI-Powered Suggestions

- **Context-Aware Responses**: Generates intelligent reply suggestions based on conversation history
- **Intention-Based Suggestions**: Choose specific goals like getting better prices, requesting samples, or negotiating terms
- **Bilingual Output**: Provides suggestions in both Chinese (for sending) and Bengali (for understanding)
- **Multiple AI Models**: Supports various Groq AI models for different quality/speed preferences

### 🎯 Smart Negotiation Tools

- **Price Negotiation**: Get suggestions for asking discounts or better pricing
- **Sample Requests**: Generate professional requests for free samples
- **MOQ Negotiation**: Help negotiate lower minimum order quantities
- **Specification Queries**: Ask detailed questions about product specifications
- **Payment Terms**: Discuss flexible payment and delivery options

## 🚀 Installation

### For Development/Testing

1. Clone this repository
2. Open Chrome/Edge browser
3. Navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select the `extension` folder
6. The extension should now be installed and active

### For Production Use

- Package the extension for distribution (coming soon)
- Install from Chrome Web Store (planned)

## ⚙️ Setup & Configuration

### API Configuration

1. Click the extension icon in your browser toolbar
2. Enter your Groq API key (get one from [groq.com](https://groq.com))
3. Select your preferred AI model:
   - **llama-3.1-8b-instant**: Fast & Good (recommended)
   - **llama-3.1-70b-versatile**: Best Quality
   - **llama-3.1-405b-reasoning**: Advanced Reasoning
   - **mixtral-8x7b-32768**: Large Context
   - **gemma2-9b-it**: Google Model

### Testing the Extension

1. Open the included `demo.html` file in your browser
2. The extension will automatically activate on the demo page
3. Try sending messages and see translations appear
4. Click the 💡 button to get AI suggestions

## 🎮 How to Use

### On 1688.com or Similar Platforms

1. Navigate to any chat conversation on 1688.com
2. The extension automatically detects and translates seller messages
3. Click the 💡 button next to the input field to get AI suggestions
4. Select your negotiation goal from the popup menu
5. Choose from the generated suggestions and send

### Translation Features

- **Seller Messages**: Automatically appear with Bengali translations
- **Your Messages**: Click the 中 button to translate English to Chinese before sending
- **Toggle Translations**: Click any translation overlay to hide/show it

### AI Suggestion Workflow

1. Click 💡 button in the chat input area
2. Choose your intention (price negotiation, samples, etc.)
3. Review the AI-generated suggestions in Chinese
4. Click 📋 to copy a suggestion to the input field
5. Send the message

## 🏗️ Technical Architecture

### Extension Components

- **manifest.json**: Extension configuration and permissions
- **background.js**: Handles API calls and translation services
- **content.js**: Injects UI elements and manages page interactions
- **popup.html/js**: Settings interface and status display
- **content.css**: Styling for translation overlays and UI elements

### APIs Used

- **Google Translate API**: Primary translation service
- **MyMemory API**: Fallback translation service
- **Groq API**: AI-powered suggestion generation

### Supported Languages

- **Chinese (zh)** ↔ **Bengali (bn)**
- **English (en)** → **Chinese (zh)**

## 🔧 Development

### Prerequisites

- Node.js (for build tools)
- Chrome/Edge browser for testing

### Build Commands

```bash
npm install
npm run build    # Production build
npm run dev      # Development build with watch mode
npm run clean    # Clean dist folder
```

### Project Structure

```
extension/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script
├── content.css           # Content script styles
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── webpack.config.js     # Build configuration
├── package.json          # Dependencies
└── icons/                # Extension icons
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg

demo.html                 # Demo page for testing
```

## 🌐 Browser Support

- **Chrome**: Full support (recommended)
- **Edge**: Full support
- **Firefox**: Planned (requires Manifest V3 adaptation)
- **Safari**: Not supported (no Manifest V3 support)

## 📋 Permissions Required

- **activeTab**: Access current tab for content injection
- **storage**: Save API keys and settings
- **scripting**: Inject content scripts
- **host_permissions**: Access to file:///\* (for demo) and 1688.com

## 🔒 Privacy & Security

- **API Keys**: Stored locally in browser storage, never transmitted except to respective APIs
- **Message Content**: Only processed for translation and AI suggestions
- **No Data Collection**: Extension does not collect or store personal data
- **Secure Communication**: All API calls use HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on the demo page
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Extension Not Working

- Ensure the extension is enabled in `chrome://extensions/`
- Check that you're on a supported page (1688.com or demo.html)
- Verify your Groq API key is correctly configured

### Translation Not Appearing

- Refresh the page after installing the extension
- Check browser console for error messages
- Ensure internet connection for API calls

### AI Suggestions Not Working

- Verify Groq API key is saved in extension settings
- Check API key format (should start with 'gsk\_')
- Ensure sufficient API credits/quota

## 📞 Support

For support, bug reports, or feature requests:

- Create an issue on GitHub
- Check the troubleshooting section above
- Test with the included demo page first

## 🎯 Future Plans

- [ ] Support for additional languages
- [ ] Integration with more e-commerce platforms
- [ ] Voice translation features
- [ ] Advanced negotiation analytics
- [ ] Mobile app companion
- [ ] Multi-platform browser support

---

**Made with ❤️ for international traders**</content>
<parameter name="filePath">/home/rakib-miah/Documents/Projects/Hackathon/September/README.md
