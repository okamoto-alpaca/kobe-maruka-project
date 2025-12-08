import * as admin from 'firebase-admin';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
    // In production, we would check for service account credentials here.
    // For this dev environment, we enforce emulator usage or specific setup.
    console.warn("FIRESTORE_EMULATOR_HOST is not set. Ensure you are connecting to the correct instance.");
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'kobe-maruka-alpaca',
        storageBucket: 'kobe-maruka-alpaca.appspot.com'
    });
}

export const db = admin.firestore();
