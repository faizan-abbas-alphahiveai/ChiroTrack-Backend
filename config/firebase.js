import admin from 'firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';


const initializeFirebase = () => {
  try {
    
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Read from environment variable when deployed (e.g., Render)
      console.log('Using Firebase service account from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      // Fallback to local file for development
      console.log('Using Firebase service account from local file');
      serviceAccount = JSON.parse(readFileSync('./chirotrack-48093-firebase-adminsdk-fbsvc-401caed6fc.json', 'utf8'));
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'chirotrack-backend'
      });
    }

    console.log('Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

export { initializeFirebase, admin };
