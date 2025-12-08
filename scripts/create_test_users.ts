import * as admin from 'firebase-admin';

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'kobe-maruka-alpaca';

// Initialize Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'kobe-maruka-alpaca',
    });
}

const auth = admin.auth();

async function createUsers() {
    const users = [
        { email: 'user1@example.com', password: 'password123', uid: 'user1' },
        { email: 'user2@example.com', password: 'password123', uid: 'user2' }
    ];

    console.log("Creating test users...");

    for (const u of users) {
        try {
            await auth.createUser({
                uid: u.uid,
                email: u.email,
                password: u.password,
            });
            console.log(`Created user: ${u.email}`);
        } catch (error: any) {
            if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
                console.log(`User already exists: ${u.email}`);
            } else {
                console.error(`Failed to create ${u.email}:`, error.message);
            }
        }
    }
    console.log("Done.");
}

createUsers();
