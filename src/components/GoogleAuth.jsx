import React, { useEffect, useState } from 'react';

const GoogleAuth = ({ onLogin }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    /* global google */
    const initializeGSI = () => {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById('gsi-button'),
        { theme: 'outline', size: 'medium' }
      );
    };

    const handleCredentialResponse = async (response) => {
      try {
        const idToken = response.credential;
        const res = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken);
        const userInfo = await res.json();

        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.profile',
          callback: (tokenResponse) => {
            const fullUser = {
              name: userInfo.name,
              picture: userInfo.picture,
              token: tokenResponse.access_token,
            };
            setUser(fullUser);
            onLogin(fullUser);
          },
        });

        tokenClient.requestAccessToken();
      } catch (err) {
        console.error('Errore nel login Google:', err);
      }
    };

    if (window.google) {
      initializeGSI();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initializeGSI;
      document.body.appendChild(script);
    }
  }, [onLogin]);

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-2">
          <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full" />
          <span className="text-sm text-gray-200">{user.name}</span>
        </div>
      ) : (
        <div id="gsi-button"></div>
      )}
    </div>
  );
};

export default GoogleAuth;
