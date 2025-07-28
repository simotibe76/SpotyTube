// src/components/GoogleAuth.jsx
import React, { useEffect, useState, createContext, useContext } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.profile';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function GoogleAuth({ onLogin }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    function initClient() {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
          const currentUser = authInstance.currentUser.get();
          const profile = currentUser.getBasicProfile();
          const token = currentUser.getAuthResponse().access_token;
          const userData = {
            name: profile.getName(),
            email: profile.getEmail(),
            token,
          };
          setUser(userData);
          onLogin && onLogin(userData);
        }
      });
    }

    gapi.load('client:auth2', initClient);
  }, []);

  const signIn = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn().then((googleUser) => {
      const profile = googleUser.getBasicProfile();
      const token = googleUser.getAuthResponse().access_token;
      const userData = {
        name: profile.getName(),
        email: profile.getEmail(),
        token,
      };
      setUser(userData);
      onLogin && onLogin(userData);
    });
  };

  const signOut = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut().then(() => {
      setUser(null);
      onLogin && onLogin(null);
    });
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <div className="text-right p-2">
        {user ? (
          <button
            onClick={signOut}
            className="text-sm text-red-500 underline hover:text-red-700"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={signIn}
            className="text-sm text-green-500 underline hover:text-green-700"
          >
            Login con Google
          </button>
        )}
      </div>
    </AuthContext.Provider>
  );
}

export default GoogleAuth;
