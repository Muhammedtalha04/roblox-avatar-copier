# Development Guide

## 🔧 Setup

```bash
# Install dependencies
cd roblox-avatar-copier
npm install

# Setup development environment
node scripts/dev-setup.js
```

## 📝 Development Workflow

### 1. Development Mode (Kod yazarken)
```bash
npm run dev
```
- ✅ Watch mode aktif (dosya değişikliklerini izler)
- ✅ Source maps aktif (debugging kolay)
- ✅ Console.log'lar korunur
- ✅ Obfuscation YOK
- ✅ Hızlı build

### 2. Test Build (Test ederken)
```bash
npm run build
```
- ✅ Production optimizasyonları
- ✅ Minified kod
- ❌ Obfuscation yok (debug edilebilir)
- ✅ Console.log'lar korunur

### 3. Release Build (Dağıtım için)
```bash
npm run package
```
- ✅ Tam obfuscation
- ✅ Console.log'lar kaldırılır
- ✅ Maksimum güvenlik
- ✅ Production ready

## 📁 Folder Structure

```
/
├── popup.js              # Orijinal kaynak kodlar
├── theme-manager.js      # (Bu dosyalar üzerinde çalış)
├── background.js         #
├── content.js            #
├── /dist                 # Build çıktıları (Git'e gitmesin)
│   ├── popup.js          # Processed versions
│   ├── theme-manager.js  #
│   └── ...               #
└── webpack.config.js     # Build configuration
```

## 🚀 Chrome Extension Yükleme

### Development sırasında:
1. `npm run dev` çalıştır
2. Chrome Extensions'a git
3. "Load unpacked" ile `/dist` klasörünü yükle

### Release build test:
1. `npm run package` çalıştır  
2. `/dist` klasörünü yükle

## 🔒 Güvenlik Notları

- **Kaynak kodlar** (`*.js`) hiç obfuscate edilmez
- **Build çıktıları** (`/dist/*.js`) obfuscate edilir
- Git sadece kaynak kodları saklar
- `/dist` klasörü .gitignore'da

## 💡 Tips

- Development sırasında hep `npm run dev` kullan
- Kod değişikliklerini kaynak dosyalarda yap
- Release öncesi `npm run package` ile test et
- Browser cache'i temizle test ederken

## 🐛 Debugging

Development build'de:
```javascript
// Console'da erişilebilir
window.themeManager.unlockAllThemes();
console.log('Debug aktif');
```

Production build'de:
```javascript
// Bu çalışmaz (güvenlik)
window.themeManager; // undefined
``` 