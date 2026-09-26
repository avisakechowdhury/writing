import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Instagram, Twitter, Linkedin } from 'lucide-react';

const Connect: React.FC = () => {
  const socials = [
    {
      name: 'Instagram',
      handle: '@writeanon.in',
      href: 'https://www.instagram.com/writeanon.in',
      icon: Instagram,
      description: 'Follow us for updates, feature drops, and community highlights.'
    },
    {
      name: 'X (Twitter)',
      handle: '@writeanon',
      href: 'https://twitter.com/writeanon',
      icon: Twitter,
      description: 'Thoughts on anonymous writing, mental health, and product changelogs.'
    },
    {
      name: 'Email',
      handle: 'writeanon.official@gmail.com',
      href: 'mailto:writeanon.official@gmail.com',
      icon: Mail,
      description: 'Reach out if you found a bug, have feedback, or just want to say hi.'
    },
    {
      name: 'LinkedIn',
      handle: 'WriteAnon',
      href: 'https://www.linkedin.com/company/writeanon/',
      icon: Linkedin,
      description: 'Learn more about the project and stay in touch with the team.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Helmet>
        <title>Connect with WriteAnon — Contact, Social Links & Community</title>
        <meta
          name="description"
          content="Connect with the WriteAnon anonymous writing community. Follow us on Instagram, X (Twitter), LinkedIn, or email us. We're building a safe space for anonymous writing and mental wellness."
        />
        <meta name="keywords" content="WriteAnon contact, anonymous writing community, WriteAnon social, anonymous writer community" />
        <link rel="canonical" href="https://writeanon.in/connect" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            Connect with us
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            WriteAnon is built as a safe, judgment-free space. If you ever want to talk to the humans
            behind it, here&apos;s where you can find us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {socials.map(({ name, handle, href, icon: Icon, description }) => (
            <a
              key={name}
              href={href}
              target={name === 'Email' ? undefined : '_blank'}
              rel={name === 'Email' ? undefined : 'noopener noreferrer'}
              className="group flex flex-col p-5 md:p-6 rounded-2xl bg-white border border-neutral-200 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">{name}</p>
                  <p className="text-base md:text-lg font-semibold text-neutral-900">
                    {handle}
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 flex-1">{description}</p>
              <span className="mt-4 text-sm font-medium text-primary-600 group-hover:text-primary-700">
                {name === 'Email' ? 'Open your email app' : 'Open in new tab'}
              </span>
            </a>
          ))}
        </div>

        {/* <div className="mt-10 md:mt-12 p-5 md:p-6 rounded-2xl bg-white border border-dashed border-neutral-300">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Creators & project maintainers
          </h2>
          <p className="text-sm text-neutral-600 mb-3">
            This section is intentionally simple so you can decide how visible you want to be.
          </p>
          <p className="text-sm text-neutral-600">
            If you&apos;d like, we can list your name(s) and a professional link (like LinkedIn) here –
            for example: <span className="font-medium">“Built by Avisake and friends”</span> with a
            link to your profile. You can safely edit this text directly in the code whenever you&apos;re
            ready to share those details.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Connect;

