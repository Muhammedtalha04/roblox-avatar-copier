# 🎭 Roblox Avatar Copier

> **Copy any Roblox avatar to your account with one click!**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome)](https://github.com/your-username/roblox-avatar-copier)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript)](https://github.com/your-username/roblox-avatar-copier)

## ✨ Features

### 🎯 Core Functionality
- **One-Click Avatar Copying** - Copy any Roblox user's avatar instantly
- **Smart Item Detection** - Automatically identifies all avatar items
- **Ownership Checking** - Shows which items you already own vs. need to purchase
- **Batch Processing** - Handles multiple avatar items efficiently
- **Cost Calculation** - Displays total Robux needed for missing items

### 🎨 Premium Theme System
- **10+ Beautiful Themes** - Including Cyberpunk, Neon, Galaxy, Ocean, and more
- **Free Themes** - Default and Dark themes included
- **Premium Bundle** - Unlock all themes with license key
- **Secret Codes** - Special unlock codes for exclusive themes

### 🌐 Multi-Language Support
- **6 Languages** - English, Turkish, Spanish, German, French, Portuguese, Chinese
- **Auto-Detection** - Automatically detects browser language
- **Easy Switching** - Change language anytime in settings

### ⚡ Performance & UX
- **Rate Limiting** - Respects Roblox API limits
- **Error Handling** - Comprehensive error management
- **Loading States** - Clear visual feedback
- **Responsive Design** - Works perfectly on all screen sizes

## 🚀 Installation

### Method 1: Chrome Web Store (Recommended)
*Coming soon - Extension under review*

### Method 2: Developer Mode Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-username/roblox-avatar-copier.git
   cd roblox-avatar-copier
   ```

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the extension folder

3. **Start Using**
   - Navigate to any Roblox profile page
   - Click the extension icon
   - Start copying avatars!

## 📖 How to Use

### Basic Usage

1. **Navigate to a Roblox Profile**
   - Go to any Roblox user's profile page
   - Make sure you're logged into Roblox

2. **Copy Avatar**
   - Click the extension icon
   - Enter the user ID or paste profile URL
   - Click "Preview Avatar" to see details
   - Click "Copy Avatar" to apply changes

3. **Check Ownership** (Optional)
   - Click "Check Items" to see which items you own
   - View missing items and their costs
   - Use "Copy Only Owned Items" for free copying

### Advanced Features

#### Secret Codes 🔑
Unlock exclusive themes with special codes:
- Enter codes in the Settings panel
- Demo codes: `DEMO_NEON`, `DEMO_GALAXY`, `PUBLIC_THEME_CODE`

#### Premium License 💎
- Purchase premium license from Gumroad
- Enter license key to unlock all themes
- Supports multiple activations

## 🛠️ Development

### Prerequisites
- Node.js 16+ (for build tools)
- Chrome browser for testing

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-username/roblox-avatar-copier.git
cd roblox-avatar-copier

# Install dependencies (if using build tools)
npm install

# Set up development environment
npm run dev
```

### Project Structure

```
roblox-avatar-copier/
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup interface
├── popup.js               # Popup logic and UI handling
├── background.js          # Background service worker
├── content.js             # Content script for Roblox pages
├── theme-manager.js       # Theme system and premium features
├── locale.js              # Multi-language translations
├── styles.css             # Main styling
├── themes.css             # Theme-specific styles
├── coffee-styles.css      # Buy me a coffee widget styles
├── images/                # Extension icons and assets
├── scripts/               # Development and build scripts
└── webpack.config.js      # Build configuration
```

### Security Configuration

⚠️ **Important**: This public repository uses demo configurations for security. For production use:

1. **Configure Gumroad Integration**
2. **Set up Production Secret Codes**
3. **Add Environment Variables**

See [SECURITY.md](SECURITY.md) for detailed configuration instructions.

## 🎨 Themes

### Free Themes
- **Default** - Clean and simple
- **Dark** - Modern dark interface

### Premium Themes
- **Cyberpunk** - Futuristic neon style
- **Neon** - Bright and vibrant
- **Galaxy** - Space-inspired design
- **Sunset** - Warm gradient colors
- **Ocean** - Cool blue tones
- **Forest** - Natural green theme
- **Love** - Romantic pink/red
- **Fire** - Hot orange/red
- **Ice** - Cool blue/white
- **Aurora** - Northern lights inspired

## 🌐 Supported Languages

- 🇺🇸 **English** - Full support
- 🇹🇷 **Türkçe** - Full support
- 🇪🇸 **Español** - Full support
- 🇩🇪 **Deutsch** - Full support
- 🇫🇷 **Français** - Full support
- 🇵🇹 **Português** - Full support
- 🇨🇳 **中文** - Full support

## 🔧 Configuration

### Environment Variables

```javascript
// For production deployment
GUMROAD_PRODUCT_ID=your_product_id
SECRET_CODES={"CODE1":"theme1","CODE2":"theme2"}
```

### Build Commands

```bash
npm run dev          # Development mode with watch
npm run build        # Production build
npm run package      # Create distribution package
```

## 📝 API Documentation

### Core Functions

```javascript
// Get avatar details
getAvatarDetails(userId)

// Apply avatar changes
applyAvatarChanges(avatarData)

// Check item ownership
checkOwnedItems(avatarData)

// Theme management
themeManager.selectTheme(themeId)
themeManager.checkSecretCode(code)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Roblox API for avatar data
- Chrome Extensions API
- All beta testers and contributors
- The Roblox development community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/roblox-avatar-copier/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/roblox-avatar-copier/discussions)
- **Email**: [your-email@example.com](mailto:your-email@example.com)

## ⭐ Show Your Support

If this project helped you, please ⭐ the repository and share it with friends!

---

**Disclaimer**: This extension is not affiliated with Roblox Corporation. Use responsibly and in accordance with Roblox Terms of Service.
