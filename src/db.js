// src/db.js
import { openDB } from 'idb';

const DB_NAME = 'spotytube-db';
const DB_VERSION = 1;
const STORE_NAME_FAVORITES = 'favorites';
const STORE_NAME_HISTORY = 'history';
const STORE_NAME_PLAYLISTS = 'playlists';

// Funzione per inizializzare il database
async function initDb() {
  console.log('--- Inizializzazione DB: Chiamata openDB ---');
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrade DB: oldVersion=${oldVersion}, newVersion=${newVersion}`);

        if (!db.objectStoreNames.contains(STORE_NAME_FAVORITES)) {
          console.log(`Creazione objectStore: ${STORE_NAME_FAVORITES}`);
          db.createObjectStore(STORE_NAME_FAVORITES, { keyPath: 'videoId' });
        } else {
          console.log(`ObjectStore ${STORE_NAME_FAVORITES} già esistente.`);
        }

        if (!db.objectStoreNames.contains(STORE_NAME_HISTORY)) {
          console.log(`Creazione objectStore: ${STORE_NAME_HISTORY}`);
          // QUI C'È UNA POSSIBILE CORREZIONE, vedi sotto!
          db.createObjectStore(STORE_NAME_HISTORY, { keyPath: 'timestamp', autoIncrement: true }); // CORREZIONE SUGGERITA
        } else {
          console.log(`ObjectStore ${STORE_NAME_HISTORY} già esistente.`);
        }

        if (!db.objectStoreNames.contains(STORE_NAME_PLAYLISTS)) {
          console.log(`Creazione objectStore: ${STORE_NAME_PLAYLISTS}`);
          db.createObjectStore(STORE_NAME_PLAYLISTS, { keyPath: 'id', autoIncrement: true });
        } else {
          console.log(`ObjectStore ${STORE_NAME_PLAYLISTS} già esistente.`);
        }
        console.log('Upgrade DB: Completato.');
      },
      blocked() {
        console.warn('Inizializzazione DB bloccata: potrebbe esserci un’altra tab aperta che usa questo DB.');
      },
      blocking(currentVersion) {
        console.warn(`Inizializzazione DB in blocco: chiudi altre connessioni al DB. Current version: ${currentVersion}`);
      }
    });
    console.log('--- Inizializzazione DB: openDB completata con successo ---');
    return db;
  } catch (err) {
    console.error('*** ERRORE FATALE durante initDb (openDB):', err);
    throw err; // Rilancia l'errore per farlo propagare
  }
}

// Funzione helper per le transazioni
async function getStore(storeName, mode) {
  const db = await initDb();
  console.log(`In getStore: Transaction per ${storeName} in modalità ${mode}`);
  try {
    const tx = db.transaction(storeName, mode);
    tx.onerror = (event) => console.error(`Transaction Error for ${storeName}:`, event.target.error);
    tx.oncomplete = () => console.log(`Transaction for ${storeName} completed.`);
    tx.onabort = () => console.warn(`Transaction for ${storeName} aborted.`);
    return tx.objectStore(storeName);
  } catch (err) {
    console.error(`*** ERRORE FATALE in getStore (transazione per ${storeName}):`, err);
    throw err;
  }
}


// --- Operazioni per i Preferiti (Favorites) ---
export async function addFavorite(videoData) {
  console.log('addFavorite: Tentativo di aggiungere', videoData.videoId);
  try {
    const store = await getStore(STORE_NAME_FAVORITES, 'readwrite');
    await store.put(videoData);
    console.log('addFavorite: Video aggiunto con successo', videoData.videoId);
  } catch (err) {
    console.error('Errore in addFavorite:', err);
    throw err;
  }
}

export async function removeFavorite(videoId) {
  console.log('removeFavorite: Tentativo di rimuovere', videoId);
  try {
    const store = await getStore(STORE_NAME_FAVORITES, 'readwrite');
    await store.delete(videoId);
    console.log('removeFavorite: Video rimosso con successo', videoId);
    return true; // Aggiunto per consistenza, indica successo
  } catch (err) {
    console.error('Errore in removeFavorite:', err);
    throw err;
  }
}

export async function getFavorites() {
  console.log('getFavorites: Tentativo di recuperare tutti i preferiti.');
  try {
    const store = await getStore(STORE_NAME_FAVORITES, 'readonly');
    const favorites = await store.getAll();
    console.log('getFavorites: Recuperati', favorites.length, 'preferiti.');
    return favorites;
  } catch (err) {
    console.error('Errore in getFavorites:', err);
    throw err;
  }
}

export async function isFavorite(videoId) {
  console.log('isFavorite: Verifica se', videoId, 'è un preferito.');
  try {
    const store = await getStore(STORE_NAME_FAVORITES, 'readonly');
    const item = await store.get(videoId);
    console.log('isFavorite: Risultato per', videoId, ':', !!item);
    return !!item;
  } catch (err) {
    console.error('Errore in isFavorite:', err);
    throw err;
  }
}


// --- Operazioni per la Cronologia (History) ---
export async function addHistoryEntry(videoData) {
  console.log('addHistoryEntry: Tentativo di aggiungere', videoData.videoId, 'alla cronologia.');
  try {
    const store = await getStore(STORE_NAME_HISTORY, 'readwrite');
    // Aggiungi un timestamp per key univoca in caso di visualizzazioni multiple dello stesso video
    const historyEntry = { ...videoData, timestamp: Date.now() };
    // Usiamo .add() qui, perché timestamp è autoIncrement e vogliamo voci separate.
    await store.add(historyEntry);
    console.log('addHistoryEntry: Video aggiunto alla cronologia con successo', videoData.videoId);
  } catch (err) {
    console.error('Errore in addHistoryEntry:', err);
    throw err;
  }
}

export async function getHistory() {
  console.log('getHistory: Tentativo di recuperare tutta la cronologia.');
  try {
    const store = await getStore(STORE_NAME_HISTORY, 'readonly');
    const history = await store.getAll();
    // Ordina per timestamp in ordine decrescente (più recenti prima)
    const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp);
    console.log('getHistory: Recuperati', sortedHistory.length, 'elementi cronologia.');
    return sortedHistory;
  } catch (err) {
    console.error('Errore in getHistory:', err);
    throw err;
  }
}


// --- Operazioni per le Playlist ---

/**
 * Aggiunge una nuova playlist al database.
 * @param {string} name Il nome della playlist.
 * @returns {number} L'ID della playlist appena creata.
 */
export async function createPlaylist(name) {
  console.log('createPlaylist: Tentativo di creare playlist con nome', name);
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_PLAYLISTS);
    const newPlaylist = { name: name, videos: [] }; // Inizia con un array vuoto di video
    const id = await store.add(newPlaylist);
    await tx.done;
    console.log('createPlaylist: Playlist creata con ID:', id, 'Nome:', name);
    return id;
  } catch (err) {
    console.error('Errore in createPlaylist:', err);
    throw err;
  }
}

/**
 * Recupera tutte le playlist.
 * @returns {Array} Un array di oggetti playlist.
 */
export async function getPlaylists() {
  console.log('getPlaylists: Tentativo di recuperare tutte le playlist.');
  try {
    const db = await initDb();
    const playlists = await db.getAll(STORE_NAME_PLAYLISTS);
    console.log('getPlaylists: Recuperate', playlists.length, 'playlist.');
    return playlists;
  } catch (err) {
    console.error('Errore in getPlaylists:', err);
    throw err;
  }
}

/**
 * Recupera una singola playlist tramite ID.
 * @param {number} playlistId L'ID della playlist da recuperare.
 * @returns {Object|undefined} L'oggetto playlist o undefined se non trovata.
 */
export async function getPlaylist(playlistId) {
  console.log('getPlaylist: Tentativo di recuperare playlist ID:', playlistId);
  try {
    const db = await initDb();
    const playlist = await db.get(STORE_NAME_PLAYLISTS, playlistId);
    console.log('getPlaylist: Playlist recuperata:', playlist ? playlist.name : 'Nessuna');
    return playlist;
  } catch (err) {
    console.error('Errore in getPlaylist:', err);
    throw err;
  }
}

/**
 * Aggiunge un video a una playlist esistente.
 * @param {number} playlistId L'ID della playlist.
 * @param {Object} videoData I dati del video da aggiungere (videoId, title, thumbnail, channelTitle).
 * @returns {boolean} True se il video è stato aggiunto, false se era già presente.
 */
export async function addVideoToPlaylist(playlistId, videoData) {
  console.log(`addVideoToPlaylist: Tentativo di aggiungere video ${videoData.videoId} a playlist ID ${playlistId}.`);
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_PLAYLISTS);
    const playlist = await store.get(playlistId);

    if (playlist) {
      const isAlreadyInPlaylist = playlist.videos.some(video => video.videoId === videoData.videoId);
      if (!isAlreadyInPlaylist) {
        playlist.videos.push(videoData);
        await store.put(playlist);
        await tx.done;
        console.log(`addVideoToPlaylist: Video "${videoData.title}" aggiunto a playlist "${playlist.name}"`);
        return true;
      } else {
        console.log(`addVideoToPlaylist: Video "${videoData.title}" è già in playlist "${playlist.name}"`);
        return false;
      }
    }
    await tx.done; // Assicurati che la transazione sia comunque completata
    console.warn(`addVideoToPlaylist: Playlist con ID ${playlistId} non trovata.`);
    return false;
  } catch (err) {
    console.error('Errore in addVideoToPlaylist:', err);
    throw err;
  }
}

/**
 * Rimuove un video da una playlist.
 * @param {number} playlistId L'ID della playlist.
 * @param {string} videoId L'ID del video da rimuovere.
 */
export async function removeVideoFromPlaylist(playlistId, videoId) {
  console.log(`removeVideoFromPlaylist: Tentativo di rimuovere video ${videoId} da playlist ID ${playlistId}.`);
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_PLAYLISTS);
    const playlist = await store.get(playlistId);

    if (playlist) {
      playlist.videos = playlist.videos.filter(video => video.videoId !== videoId);
      await store.put(playlist);
      await tx.done;
      console.log(`removeVideoFromPlaylist: Video ${videoId} rimosso da playlist ${playlist.name}`);
    } else {
      await tx.done; // Assicurati che la transazione sia comunque completata
      console.warn(`removeVideoFromPlaylist: Playlist con ID ${playlistId} non trovata.`);
    }
  } catch (err) {
    console.error('Errore in removeVideoFromPlaylist:', err);
    throw err;
  }
}

/**
 * Aggiorna i dettagli di una playlist (es. nome).
 * @param {Object} playlist L'oggetto playlist aggiornato (deve includere l'ID).
 */
export async function updatePlaylist(playlist) {
  console.log('updatePlaylist: Tentativo di aggiornare playlist ID:', playlist.id);
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_PLAYLISTS);
    await store.put(playlist);
    await tx.done;
    console.log('updatePlaylist: Playlist aggiornata:', playlist.name);
  } catch (err) {
    console.error('Errore in updatePlaylist:', err);
    throw err;
  }
}

/**
 * Elimina una playlist dal database.
 * @param {number} playlistId L'ID della playlist da eliminare.
 */
export async function deletePlaylist(playlistId) {
  console.log('deletePlaylist: Tentativo di eliminare playlist ID:', playlistId);
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_PLAYLISTS);
    await store.delete(playlistId);
    await tx.done;
    console.log('deletePlaylist: Playlist eliminata con ID:', playlistId);
  } catch (err) {
    console.error('Errore in deletePlaylist:', err);
    throw err;
  }
}