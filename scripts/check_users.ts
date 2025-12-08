import * as admin from 'firebase-admin';

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'kobe-maruka-alpaca';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'kobe-maruka-alpaca',
    });
}

async function listUsers() {
    console.log("Listing users for project: kobe-maruka-alpaca");
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        if (listUsersResult.users.length === 0) {
            console.log("No users found.");
        } else {
            listUsersResult.users.forEach((userRecord) => {
                console.log('user', userRecord.toJSON());
            });
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
}

listUsers();
