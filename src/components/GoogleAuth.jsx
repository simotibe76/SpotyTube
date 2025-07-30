import React, { useEffect } from 'react';

function GoogleAuth({ onLogin }) {
  useEffect(() => {
    const initializeGapi = () => {
      window.gapi.load('auth2', () => {
        const auth2 = window.gapi.auth2.init({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl',
        });

        auth2.then(() => {
          if (auth2.isSignedIn.get()) {
            const user = auth2.currentUser.get();
            const profile = user.getBasicProfile();
            const token = user.getAuthResponse().access_token;
            onLogin({
              name: profile.getName(),
              imageUrl: profile.getImageUrl(),
              token,
              userObj: user,
            });
          }
        });
      });
    };

    if (window.gapi) {
      initializeGapi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initializeGapi;
      document.body.appendChild(script);
    }
  }, [onLogin]);

  const handleLogin = () => {
    const auth2 = window.gapi.auth2.getAuthInstance();
    auth2.signIn().then(user => {
      const profile = user.getBasicProfile();
      const token = user.getAuthResponse().access_token;
      onLogin({
        name: profile.getName(),
        imageUrl: profile.getImageUrl(),
        token,
        userObj: user,
      });
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition"
    >
      Login con Google
    </button>
  );
}

export default GoogleAuth;
