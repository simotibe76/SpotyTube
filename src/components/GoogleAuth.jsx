import { useEffect } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleAuth({ onLogin }) {
  useEffect(() => {
    const initializeGapi = () => {
      if (!window.google || !CLIENT_ID) {
        console.error("Google API non disponibile o CLIENT_ID mancante");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.prompt(); // mostra popup login se non loggato
    };

    const handleCredentialResponse = (response) => {
      const token = response.credential;
      const user = parseJwt(token);
      if (user) {
        onLogin({ ...user, token });
      } else {
        console.error("Token Google non valido");
      }
    };

    const parseJwt = (token) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
      } catch (err) {
        console.error("Errore nel parsing del JWT:", err);
        return null;
      }
    };

    initializeGapi();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Benvenuto su SpotyTube</h1>
      <p className="text-lg text-gray-400">Per continuare, accedi con Google</p>
    </div>
  );
}

export default GoogleAuth;
