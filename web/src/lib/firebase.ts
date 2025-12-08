import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "fake-api-key",
    authDomain: "kobe-maruka-alpaca.firebaseapp.com",
    projectId: "kobe-maruka-alpaca",
    storageBucket: "kobe-maruka-alpaca.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to Emulators in Development
if (process.env.NODE_ENV === 'development') {
    // Prevent multiple connections
    if (!(global as any)._emulatorsConnected) {
        connectAuthEmulator(auth, "http://127.0.0.1:9099");
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        (global as any)._emulatorsConnected = true;
        console.log('Connected to Auth, Firestore & Storage Emulators');
    }
}

export { auth, db, storage };
