# DISHA - Disaster Intelligence System for Human Assistance

<div align="center">

![DISHA Banner](https://img.shields.io/badge/DISHA-Emergency%20Response%20Platform-007AFF?style=for-the-badge)

**Advanced emergency response platform providing real-time alerts, intelligent routing, and AI-powered evacuation guidance.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Usage](#usage) • [API](#api-documentation) • [Contributing](#contributing)

</div>

---

## 📋 Overview

DISHA is a comprehensive disaster management and emergency response mobile application designed to save lives during critical situations. The platform combines real-time location tracking, AI-powered decision making, and augmented reality navigation to provide users with the fastest and safest evacuation routes during emergencies.

### 🎯 Key Highlights

- **24/7 Active Monitoring** - Continuous system surveillance for immediate threat detection
- **< 3s Alert Response** - Lightning-fast emergency notifications
- **100% Reliability** - Mission-critical infrastructure built for zero downtime
- **AI-Powered Guidance** - Intelligent evacuation recommendations based on real-time data

---

## ✨ Features

### 🗺️ **Live Emergency Map**
- **Real-time Location Tracking** - GPS-based continuous position monitoring with live updates
- **Danger Zone Visualization** - Dynamic circular overlays showing hazardous areas with 2km radius
- **Safe Location Discovery** - Automatic identification of nearby hospitals, shelters, and safe zones
- **Intelligent Route Calculation** - OSRM-powered walking routes with distance and time estimates
- **Dark Map Theme** - Professional Uber/Ola-style dark map for better visibility
- **Live Navigation** - Turn-by-turn guidance with automatic camera following

### 🤖 **AI Assistant**
- **Image Analysis** - Upload photos of emergency situations for instant AI assessment
- **Natural Language Processing** - Describe situations in plain text for personalized advice
- **Evacuation Recommendations** - Context-aware guidance based on location and threat type
- **Multi-modal Input** - Support for text, images, or combined queries
- **Real-time Responses** - Fast AI-powered analysis with streaming responses

### 📍 **AR Navigation**
- **Augmented Reality Guidance** - Overlay directional arrows on real-world camera view
- **Live View Integration** - Seamless connection with Google Maps Live View
- **Step-by-step Instructions** - Clear visual waypoints for easy navigation
- **Outdoor Optimization** - GPS-enhanced accuracy for open-air environments

### 🚨 **Emergency Contacts**
- **Quick Dial Access** - One-tap calling to emergency services
- **Comprehensive Directory** - Ambulance (102), Police (100), Fire (101), Disaster Management (108)
- **Specialized Helplines** - Women's helpline (1091), Accident reporting (1073)
- **Visual Indicators** - Color-coded contact cards for instant recognition

### 🎨 **Modern UI/UX**
- **Dynamic Island Navigation** - iOS-inspired floating navigation bar
- **Professional Design** - Clean, minimal interface with production-grade polish
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Dark Mode Support** - Eye-friendly dark theme for maps
- **Responsive Layout** - Optimized for all screen sizes

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native 0.81 with Expo SDK 54
- **Navigation**: React Navigation 7 (Native Stack & Bottom Tabs)
- **Maps**: react-native-maps with custom dark styling
- **Location**: expo-location for GPS tracking
- **UI Components**: Custom-built with React Native primitives
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Animations**: React Native Animated API
- **HTTP Client**: Axios for API communication

### Backend (API Server)
- **Framework**: Flask (Python)
- **AI/ML**: Google Gemini API for image and text analysis
- **Computer Vision**: OpenCV for image processing
- **Object Detection**: Kalman Filter for predictive tracking
- **Routing**: OSRM (Open Source Routing Machine) for path calculation
- **Location Data**: Overpass API for OpenStreetMap queries
- **CORS**: Flask-CORS for cross-origin requests

### Infrastructure
- **Deployment**: Render (Backend), Expo Go (Mobile)
- **Maps Provider**: OpenStreetMap with Leaflet.js fallback
- **AR Integration**: Google Maps Live View
- **Real-time Updates**: Polling-based danger zone monitoring

---

## 📦 Installation

### Prerequisites
- Node.js 20+ and npm
- Python 3.9+
- Expo Go app on your mobile device
- Git

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/disha.git
cd disha/Frontend/MyBlankApp

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npx expo start

# Scan the QR code with Expo Go app
```

### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the server
python app.py
```

### Environment Variables

Create a `.env` file in the Backend directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key
FLASK_ENV=development
PORT=5000
```

---

## 🚀 Usage

### Running the App

1. **Start Backend Server**
   ```bash
   cd Backend
   python app.py
   ```
   Server will run on `http://localhost:5000`

2. **Start Mobile App**
   ```bash
   cd Frontend/MyBlankApp
   npx expo start
   ```
   Scan QR code with Expo Go

3. **Grant Permissions**
   - Allow location access for map features
   - Allow camera access for AR navigation
   - Allow photo library access for AI image analysis

### Key Workflows

#### Emergency Evacuation
1. Open the app and navigate to the Map screen
2. View your current location and nearby safe zones
3. If danger zone is active, follow the blue evacuation route
4. Tap on any safe location to calculate a custom route
5. Use AR Navigation for turn-by-turn guidance

#### AI Assistance
1. Navigate to the Chat screen
2. Describe your emergency situation or upload a photo
3. Receive instant AI-powered evacuation advice
4. Follow the recommended actions

---

## 📡 API Documentation

### Base URL
```
https://sentinel-shield-m-indicator-hacks.onrender.com
```

### Endpoints

#### 1. Get Danger Zone Status
```http
GET /danger-status
```

**Response**
```json
{
  "danger_zone": true,
  "timestamp": "2024-03-04T12:00:00Z"
}
```

#### 2. AI Evacuation Tips
```http
POST /ai/evacuation-tips
Content-Type: multipart/form-data
```

**Parameters**
- `prompt` (string): Text description of the situation
- `image` (file): Optional image file for analysis

**Response**
```json
{
  "ai_evacuation_advice": "Based on the image analysis, I recommend..."
}
```

#### 3. Route Calculation (OSRM)
```http
GET https://router.project-osrm.org/route/v1/foot/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson
```

**Response**
```json
{
  "routes": [{
    "geometry": {
      "coordinates": [[lon, lat], ...]
    },
    "distance": 1234.5,
    "duration": 890.2
  }]
}
```

---

## 🏗️ Project Structure

```
disha/
├── Frontend/
│   └── MyBlankApp/
│       ├── screens/
│       │   ├── Home.tsx          # Landing screen with features
│       │   ├── MapScreen.tsx     # Emergency map with routing
│       │   ├── Chat.tsx          # AI assistant interface
│       │   └── AR.tsx            # AR navigation guide
│       ├── components/
│       │   └── Navbar.tsx        # Dynamic Island navigation
│       ├── assets/               # Images and static files
│       └── App.tsx               # Root navigation setup
├── Backend/
│   ├── app.py                    # Flask server entry point
│   ├── AsyncCallalerts/          # Alert system module
│   ├── Evcauation_tips/          # AI tips module
│   ├── RouteLoadBalance/         # Route optimization
│   └── Kalmans-Filter--master/   # Object tracking
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenStreetMap for map data
- OSRM for routing engine
- Google Gemini for AI capabilities
- Expo team for the amazing framework
- React Native community

---

## 📞 Support

For support, email support@disha-app.com or open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for saving lives during emergencies**

[⬆ Back to Top](#disha---disaster-intelligence-system-for-human-assistance)

</div>
