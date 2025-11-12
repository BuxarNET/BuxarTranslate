# BuxarTranslate

🌐 **Read in:** [English](README.md) | [Русский](README_RU.md)

# BuxarTranslate - Thunderbird Translation Extension

[![Thunderbird Add-on](https://img.shields.io/amo/v/BuxarTranslate.svg)](https://addons.thunderbird.net/thunderbird/addon/buxartranslate/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/BuxarNET/BuxarTranslate)](https://github.com/BuxarNET/BuxarTranslate/releases)

A powerful and user-friendly Thunderbird extension that enables instant translation of selected text in emails using Google Translate API. Supporting 100+ languages with auto-detection and multi-language interface.

## 🌟 Features

- **Instant Translation**: Select text and translate via right-click context menu
- **100+ Languages**: Comprehensive language support including rare languages
- **Auto-detection**: Automatically detects source language
- **Multi-language UI**: Interface available in English, Russian, Spanish, German, French, Italian
- **Dual Display**: Translation results in notifications and separate windows
- **Smart Formatting**: Preserves line breaks and text formatting
- **Quick Access**: Recent languages and search functionality
- **Customizable**: Adjustable display time and interface preferences

## 🚀 Installation

### From Thunderbird Add-ons Store (Recommended)
[Download BuxarTranslate from Thunderbird Add-ons](https://addons.thunderbird.net/)

### Manual Installation
1. Download the latest `BuxarTranslate.xpi` from [Releases](../../releases)
2. Open Thunderbird → Add-ons Manager (Ctrl+Shift+A)
3. Drag and drop the `.xpi` file into the add-ons window
4. Click "Install" and restart Thunderbird

### Development Version
bash
git clone https://github.com/BuxarNET/BuxarTranslate.git
cd BuxarTranslate
npm run build

## 📖 Usage

1. **Select Text**: Highlight any text in an email message
2. **Right-click**: Choose "Translate to [Language]" from context menu
3. **View Results**: See translation in notification popup and detailed window
4. **Copy & Use**: Click "Copy Translation" to use the translated text

## 🛠️ For Developers

### Prerequisites
- Thunderbird 78.0 or later
- Git
- Basic knowledge of JavaScript

### Building from Source
git clone https://github.com/BuxarNET/BuxarTranslate.git
cd BuxarTranslate
npm run build

### Project Structure
```
BuxarTranslate/
├── src/                # Extension source code
├── docs/               # Documentation
├── scripts/            # Build scripts
└── build/              # Built packages
```
## 🌐 Supported Languages

### Interface Languages
- English
- Русский (Russian)
- Español (Spanish)
- Deutsch (German)
- Français (French)
- Italiano (Italian)

### Translation Languages
100+ languages including: Arabic, Chinese, Dutch, French, German, Greek, Hebrew, Hindi, Italian, Japanese, Korean, Portuguese, Russian, Spanish, Turkish, and many more.

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Commit your changes: git commit -m 'Add amazing feature'
4. Push to the branch: git push origin feature/amazing-feature
5. Open a Pull Request

### Adding New Languages
To add a new interface language:
1. Create _locales/xx/messages.json (replace xx with language code)
2. Translate all message keys from English version
3. Update language detection in code
4. Submit Pull Request

## 💖 Donations

If you find BuxarTranslate useful, please consider supporting its development:

### Cryptocurrency
- **Bitcoin**: 13DiqXuWkLwThkXQHShtBnwvEcvHHWWAg4
- **Ethereum**: 0x8F3951AF2686a7697aeEce0DfF23d2C1eD0c0f99
- **NASHI**: 3P5nT1a1CAdEPPHTSTaF5Ygj7k5s7KeBnbB

### Russia
- **YooMoney**: [https://yoomoney.ru/to/4100173831748](https://yoomoney.ru/to/4100173831748)

### Transfers from any country worldwide:
- **Paysera**: Account Number: EVP8610001034598

Your support helps maintain and improve this extension!

## 🔧 Technical Details

- **Manifest Version**: 2
- **Minimum Thunderbird**: 78.0
- **API**: Google Translate (free tier)
- **Permissions**: storage, menus, notifications, activeTab
- **Storage**: Local storage for settings and preferences

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Website**: [https://buxarnet.ru/BuxarTranslate/](https://buxarnet.ru/BuxarTranslate/)
- **GitHub Issues**: [Report bugs or request features](https://github.com/BuxarNET/BuxarTranslate/issues)
- **Email**: Contact via GitHub issues

## 🙏 Acknowledgments

- Google Translate API for translation services
- Thunderbird team for excellent extension platform
- Contributors and translators who help improve this extension

---

**BuxarTranslate** - Making communication without language barriers in Thunderbird!