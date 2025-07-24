import React, { useState } from 'react';
import { 
  PenTool, 
  Users, 
  Target, 
  Flame, 
  Star, 
  ArrowRight,
  Heart,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import AuthModal from '../components/Auth/AuthModal';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: PenTool,
      title: 'Express Yourself',
      description: 'Write freely with our rich-text editor. Share anonymously or publicly - your choice.',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Users,
      title: 'Supportive Community',
      description: 'Connect with fellow writers. Get encouragement, share experiences, and grow together.',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      icon: Target,
      title: 'Build Habits',
      description: 'Track your writing streaks, earn points, and unlock achievements as you write daily.',
      color: 'from-accent-500 to-accent-600'
    },
    {
      icon: Flame,
      title: 'Stay Motivated',
      description: 'Daily reminders, streak tracking, and rewards keep you motivated to write every day.',
      color: 'from-error-500 to-error-600'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Manager',
      content: 'This app helped me overcome my fear of writing. The supportive community makes all the difference.',
      avatar: '👩‍💼'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Student',
      content: 'I never thought I could write daily. The streak system is addictive in the best way possible!',
      avatar: '👨‍🎓'
    },
    {
      name: 'Emily Watson',
      role: 'Teacher',
      content: 'The anonymous sharing feature gave me the confidence to share my thoughts without judgment.',
      avatar: '👩‍🏫'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                WriteAnon
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignIn}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Overcome Your Fear of
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Writing
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join a supportive community of writers. Share your thoughts anonymously or publicly, 
              build daily writing habits, and discover the joy of expression without judgment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Start Writing Today</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need to Start Writing
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Our platform combines the best of journaling, social interaction, and habit building
              to help you develop a consistent writing practice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-neutral-50 rounded-2xl p-8 h-full hover:bg-white hover:shadow-soft transition-all duration-300 border border-neutral-200">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Join Thousands of Writers
            </h2>
            <p className="text-xl text-neutral-600">
              See what our community members are saying about their writing journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-soft border border-neutral-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{testimonial.name}</h4>
                    <p className="text-sm text-neutral-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-neutral-700 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent-500 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-error-500 mr-2" />
                <span className="text-4xl font-bold text-neutral-900">10K+</span>
              </div>
              <p className="text-neutral-600">Posts shared with love</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary-500 mr-2" />
                <span className="text-4xl font-bold text-neutral-900">25K+</span>
              </div>
              <p className="text-neutral-600">Supportive comments</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-success-500 mr-2" />
                <span className="text-4xl font-bold text-neutral-900">85%</span>
              </div>
              <p className="text-neutral-600">Users write daily after 30 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Writing Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Join our community today and discover the writer within you. 
            Start with just a few words, and watch your confidence grow.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">WriteAnon</span>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; 2025 WriteAnon. All rights reserved.</p>
              <p className="text-sm mt-1">Made with ❤️ for you to express yourself without being judged</p>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default Landing;