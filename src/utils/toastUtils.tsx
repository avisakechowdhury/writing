import toast from 'react-hot-toast';

// Keep this reusable outside React
const showAuthModal = (mode: 'login' | 'signup' = 'signup') => {
  if ((window as any).showAuthModalGlobal) {
    (window as any).showAuthModalGlobal(mode);
  }
};

// Redirect to landing page for authentication
export const redirectToLanding = () => {
  window.location.href = '/landing';
};

// ✅ Rich toast with JSX
export const showAuthRequiredToast = (action: string) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 
                       7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 
                       1.293a1 1 0 101.414 1.414L10 11.414l1.293 
                       1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293
                       a1 1 0 00-1.414-1.414L10 8.586 
                       8.707 7.293z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Authentication Required
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Please login to {action}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 
                           hover:text-gray-500 focus:outline-none 
                           focus:ring-2 focus:ring-offset-2 
                           focus:ring-indigo-500"
                onClick={() => toast.dismiss(t.id)}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586
                       l4.293-4.293a1 1 0 111.414 1.414L11.414 
                       10l4.293 4.293a1 1 0 01-1.414 1.414L10 
                       11.414l-4.293 4.293a1 1 0 
                       01-1.414-1.414L8.586 10 
                       4.293 5.707a1 1 0 010-1.414z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                showAuthModal('login');
                toast.dismiss(t.id);
              }}
              className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 
                         text-sm font-medium rounded-md 
                         hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                showAuthModal('signup');
                toast.dismiss(t.id);
              }}
              className="flex-1 bg-gradient-to-r from-primary-500 
                         to-secondary-500 text-white px-3 py-2 
                         text-sm font-medium rounded-md 
                         hover:from-primary-600 hover:to-secondary-600 
                         transition-all duration-200"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: 'top-right',
    }
  );
};

// ✅ Simpler JSX toast
export const showAuthRequiredToastSimple = (action: string) => {
  // Redirect to landing page instead of showing toast
  redirectToLanding();
};

// ✅ Non-JSX fallback (safe in .ts files too)
export const showAuthRequiredToastFallback = (action: string) => {
  toast.error(`Please login to ${action}`, {
    duration: 4000,
    position: 'top-right',
  });
};
