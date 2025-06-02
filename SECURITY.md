# 🔒 Security Notice for Public Repository

## ⚠️ Important Security Information

This is a **public version** of the Roblox Avatar Copier extension. Some sensitive configurations have been removed or replaced with placeholders for security purposes.

### 🚫 What's Not Included in This Public Version

1. **Production Secret Codes**: Demo codes are provided instead
2. **Gumroad Product IDs**: Placeholder IDs are used
3. **Premium License Keys**: Demo validation only
4. **Development Unlock Functions**: Restricted to development mode only

### 🔧 Configuration Required for Production Use

To use this code in production, you'll need to:

1. **Set up Gumroad Integration**:
   ```javascript
   // Replace in theme-manager.js
   function getGumroadProductId() {
       return 'YOUR_ACTUAL_GUMROAD_PRODUCT_ID';
   }
   ```

2. **Configure Secret Codes**:
   ```javascript
   // Update secret codes in checkSecretCode()
   const secretCodes = {
       'YOUR_SECRET_CODE': 'theme_name'
   };
   ```

3. **Set up Environment Variables** (recommended):
   ```javascript
   const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
   const SECRET_CODES = JSON.parse(process.env.SECRET_CODES || '{}');
   ```

### 🛡️ Security Features Included

- ✅ Development mode detection
- ✅ License validation framework
- ✅ Rate limiting for API calls
- ✅ Input validation and sanitization
- ✅ Premium feature access control
- ✅ Production security warnings

### 📝 Demo Features

The public version includes demo functionality:

- **Demo Secret Codes**: `DEMO_NEON`, `DEMO_GALAXY`, `PUBLIC_THEME_CODE`
- **Demo License Validation**: Always passes in development mode
- **Demo Premium Features**: Placeholder implementation

### 🚀 Development Setup

1. Clone this repository
2. Configure your production settings (see above)
3. Test in development mode first
4. Deploy with proper security configurations

### 📞 Support

For questions about the full premium implementation or security concerns, please contact the repository maintainer.

---

**Note**: This public version is provided for educational and demonstration purposes. Always implement proper security measures for production use. 