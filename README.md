# WriteAnon - Anonymous Writing Community

A supportive platform for writers to share their thoughts anonymously or publicly, build daily writing habits, and connect with fellow writers.

## New Features (Latest Update)

### 🎯 Random Chat System
- **Real-time matching**: Connect with users who share your interests
- **Topic-based matching**: Choose from 10 different topics (General, Books, Movies, Music, Technology, Travel, Food, Sports, Art, Philosophy)
- **Anonymous by default**: Chat anonymously to protect privacy
- **AI Companion**: When no human partners are available, chat with an empathetic AI companion
- **Mobile-friendly**: Floating chat toggle for mobile devices
- **Skip functionality**: Skip to find a new partner anytime

### 📱 Mobile UI Improvements
- **Fixed overlapping navigation**: Streamlined mobile bottom navigation
- **Random chat toggle**: Floating action button for easy access to random chat
- **Responsive design**: Optimized for all screen sizes

### 🔒 Anonymous Reading
- **Public access**: Non-logged-in users can read posts without authentication
- **Login prompts**: Clear prompts when trying to like, comment, or use features requiring login
- **Read-only mode**: Anonymous users can browse and read content freely

### 🚨 Report System
- **Comprehensive reporting**: Report posts, comments, chat messages, and users
- **Multiple reasons**: Spam, inappropriate content, harassment, hate speech, violence, misinformation, copyright violation, and other
- **User-friendly interface**: Easy-to-use report modal with detailed descriptions
- **Moderation support**: Detailed reports help maintain community safety

### 🤖 AI Companion Features
- **Empathetic responses**: Context-aware, supportive AI responses
- **Topic-specific conversations**: AI adapts to the chosen chat topic
- **Fallback option**: Available when no human partners are found
- **Natural conversation flow**: Simulates human-like typing delays and responses

## Technical Implementation

### Backend
- **New Models**: `RandomChat` and `Report` models for data persistence
- **Real-time Socket.IO**: Live chat functionality with room management
- **API Routes**: Complete REST API for random chat and reporting features
- **User Matching**: Intelligent partner matching based on topics and availability

### Frontend
- **React Hooks**: Custom hooks for random chat and socket management
- **TypeScript**: Full type safety for all new features
- **Responsive Components**: Mobile-first design approach
- **State Management**: Efficient state handling for real-time features

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in server directory
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Start the development servers**
   ```bash
   # Start frontend (from root directory)
   npm run dev
   
   # Start backend (from server directory)
   npm run dev
   ```

## Usage

### Random Chat
1. Click the "Random Chat" button in the navigation (desktop) or floating chat button (mobile)
2. Choose a topic of interest
3. Toggle anonymous mode if desired
4. Start searching for a partner
5. Chat in real-time with matched users or AI companion

### Anonymous Reading
1. Visit the site without logging in
2. Browse and read posts freely
3. Click "Read Posts" on the landing page to access the feed
4. Login when prompted for interactive features

### Reporting Content
1. Click the "More" menu (⋮) on any post
2. Select "Report post"
3. Choose a reason and provide details
4. Submit the report for moderation

## Features

### Core Features
- ✅ Anonymous and public writing
- ✅ Daily writing streaks and achievements
- ✅ Rich text editor with formatting
- ✅ Community feed with likes and comments
- ✅ User profiles and following system
- ✅ Real-time notifications
- ✅ Mobile-responsive design

### New Features
- ✅ Real-time random chat with topic matching
- ✅ AI companion for when no humans are available
- ✅ Anonymous reading for non-logged-in users
- ✅ Comprehensive reporting system
- ✅ Mobile-optimized random chat interface
- ✅ Socket.IO real-time communication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@writeanon.com or join our community discussions.

---

**Radha Radha** 🙏
