import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  PenTool, 
  Users,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Heart,
  MessageCircle,
  BookOpen,
  Lock,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AuthModal from '../components/Auth/AuthModal';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      icon: ShieldCheck,
      title: 'Safe, private expression',
      description: 'Use WriteAnon as an anonymous journal online and a private digital diary for your real thoughts.',
      color: 'from-primary-500 to-secondary-500'
    },
    {
      icon: Users,
      title: 'Supportive writing community',
      description: 'Share thoughts anonymously with others and find an interest-based anonymous writing community.',
      color: 'from-secondary-500 to-accent-500'
    },
    {
      icon: PenTool,
      title: 'Daily writing habit',
      description: 'Build a mindfulness writing routine with daily reflection prompts and habit-based reminders.',
      color: 'from-accent-500 to-primary-500'
    },
    {
      icon: Heart,
      title: 'Mental wellness support',
      description: 'A daily mental health journal flow designed for emotional release, anxiety relief, and reflection.',
      color: 'from-primary-600 to-secondary-600'
    }
  ];

  const howItWorks = [
    {
      icon: BookOpen,
      step: '1',
      title: 'Sign up in seconds',
      description: 'Create a free account. No real name required — choose any display name you like.'
    },
    {
      icon: PenTool,
      step: '2',
      title: 'Write your thoughts',
      description: 'Use the rich text editor to write posts, journal entries, or stories. Post anonymously or with your username.'
    },
    {
      icon: Globe,
      step: '3',
      title: 'Share with the community',
      description: 'Your post appears in the public feed where others can read, like, and comment — all in a supportive space.'
    },
    {
      icon: Lock,
      step: '4',
      title: 'Stay anonymous & safe',
      description: 'Your privacy is always protected. Write anonymously, connect via random chat, and express freely.'
    }
  ];

  const faqs = [
    {
      question: 'What is WriteAnon?',
      answer: 'WriteAnon is a free anonymous writing platform designed for mental wellness. You can write journal entries, share stories, and express your thoughts without revealing your identity. It combines an anonymous journal, a writing community, and random chat features.'
    },
    {
      question: 'Is WriteAnon completely free?',
      answer: 'Yes, WriteAnon is 100% free to use. You can create an account, write unlimited posts, use random chat, and engage with the community at no cost.'
    },
    {
      question: 'Can I write anonymously on WriteAnon?',
      answer: 'Absolutely. When creating a post, you can toggle the "Post anonymously" option to hide your username. Your identity remains private, and only you know you wrote the post.'
    },
    {
      question: 'Where can I write my thoughts online anonymously?',
      answer: 'WriteAnon is the perfect place. Unlike social media, WriteAnon is built specifically for anonymous expression and mental wellness. You can write journal entries, vent feelings, or share stories — all without revealing who you are.'
    },
    {
      question: 'How does random chat work on WriteAnon?',
      answer: 'Random chat connects you with another user based on a shared topic of interest (books, music, technology, philosophy, etc.). The chat is anonymous and the history is not permanently stored, keeping your conversations private.'
    },
    {
      question: 'Is my data safe on WriteAnon?',
      answer: 'We take privacy seriously. Anonymous posts cannot be traced back to your account by other users. We use encrypted connections and do not sell or share your personal data.'
    },
    {
      question: 'Can I use WriteAnon for journaling and mental health?',
      answer: 'Yes — WriteAnon is designed as a daily mental health journal. Writing regularly has been shown to help with anxiety relief, emotional processing, and self-reflection. Features like streak tracking help you build a consistent writing habit.'
    }
  ];

  // FAQ schema for structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-violet-50/50">
      <Helmet>
        <title>WriteAnon — Free Anonymous Writing Platform for Mental Wellness & Journaling</title>
        <meta name="description" content="WriteAnon is a free anonymous writing platform for mental wellness. Write anonymously online, keep a private digital diary, journal for mental health, share stories, and connect with others in a safe space." />
        <meta name="keywords" content="anonymous writing, anonymous journal online, write anonymously, anonymous writer, anonymous writing website, anonymous writing platform, private digital diary, daily mental health journal, journaling for mental health, write your thoughts online, where can I write my thoughts online, anonymous posting site, publish anonymously online, anon writer, expressive writing, safe space to vent anonymously" />
        <link rel="canonical" href="https://writeanon.in/landing" />
        <meta property="og:title" content="WriteAnon — Free Anonymous Writing Platform for Mental Wellness" />
        <meta property="og:description" content="Write anonymously online, journal for mental health, and express yourself freely in a safe anonymous writing community." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://writeanon.in/landing" />
        <meta property="og:image" content="https://writeanon.in/assets/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WriteAnon — Anonymous Writing Platform" />
        <meta name="twitter:description" content="Free anonymous writing for mental wellness. Journal privately, share stories, and connect." />
        <meta name="twitter:image" content="https://writeanon.in/assets/og-image.png" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
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
              <Link
                to="/connect"
                className="hidden sm:inline-flex px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                Connect
              </Link>
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
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-12 left-[10%] h-52 w-52 rounded-full bg-primary-200/50 blur-3xl" />
          <div className="absolute top-24 right-[12%] h-60 w-60 rounded-full bg-secondary-200/40 blur-3xl" />
          <div className="absolute bottom-4 left-[35%] h-56 w-56 rounded-full bg-violet-200/40 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-1.5 text-sm text-primary-700 mb-5">
              <Sparkles className="w-4 h-4" />
              <span>Free anonymous writing for mental wellbeing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Write anonymously.
              <span className="block bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-500 bg-clip-text text-transparent">
                Express, reflect, and heal.
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-600 font-medium italic mb-4">
              Your story. Your secret.
            </p>
            <p className="text-lg sm:text-xl text-neutral-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              WriteAnon is a free anonymous writing platform that blends a private digital diary,
              expressive writing therapy, and an anonymous writing community so you can process
              emotions through writing — safely and freely.
            </p>
            <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl max-w-2xl mx-auto">
              <p className="text-blue-800 font-medium">
                Please sign in to write posts, react, comment, and save your journaling routine.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Start Writing Anonymously — Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/"
                className="px-8 py-4 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Explore Community Posts</span>
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Designed for daily reflection
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              From anxiety relief journaling to mindful writing habits, everything is built to feel calm and supportive.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 h-full hover:shadow-soft transition-all duration-300 border border-neutral-200">
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

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Start writing anonymously in under a minute. No real name needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-xl bg-white border border-neutral-200 hover:shadow-soft transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — provides content for long-tail queries and FAQ rich snippets */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-neutral-600">
              Everything you need to know about WriteAnon
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-neutral-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 pr-4">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-neutral-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-secondary-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Where can you write your thoughts safely online?
          </h2>
          <p className="text-2xl text-primary-100 font-medium italic mb-4">
            Right here, on WriteAnon.
          </p>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Start with a few words, vent feelings anonymously, and build a daily writing habit that supports mental wellbeing. It's free, private, and always here for you.
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
              <div>
                <span className="text-xl font-bold text-white">WriteAnon</span>
                <p className="text-xs text-primary-100 italic">Your story. Your secret.</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} WriteAnon. All rights reserved.</p>
              <p className="text-sm mt-1">Made with ❤️ for writers who value privacy</p>
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