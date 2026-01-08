# 📱 SalonHub Mobile

A professional mobile application for salon managers to manage their business on-the-go.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)
![Framework](https://img.shields.io/badge/framework-React%20Native-61DAFB.svg)

## ✨ Features

- 🔐 Secure authentication with JWT
- 📊 Comprehensive business dashboard
- 📅 Appointment management with status tracking
- 👥 Client database with search
- ✂️ Services catalog with categories
- ⚙️ Settings and profile management

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Scan QR code with Expo Go app
```

## 📚 Documentation

- [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) - Full implementation guide
- [PHASE_1_IMPLEMENTATION.md](PHASE_1_IMPLEMENTATION.md) - Phase 1 details
- [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md) - Phase 2 details

## 🛠 Tech Stack

- React Native + Expo SDK 54
- React Navigation 6
- Axios for API calls
- Expo SecureStore for auth tokens

## ⚙️ Configuration

Update API URL in `src/services/api.js`:

```javascript
baseURL: 'http://YOUR_LOCAL_IP:3000/api'
```

**Important**: Use your computer's local IP, not `localhost`!

## 📱 Running on Device

1. Install Expo Go on your phone
2. Make sure phone and computer are on same Wi-Fi
3. Run `npx expo start`
4. Scan QR code with Expo Go

## 🔧 Troubleshooting

**Can't connect to API?**
- Verify your IP address configuration
- Check both devices on same Wi-Fi
- Ensure backend is running

**App won't load?**
- Try `npx expo start --clear`
- Check console for errors
- Reload in Expo Go (shake device)

## 📄 License

Private project - All rights reserved

---

**Built with ❤️ using React Native + Expo**
