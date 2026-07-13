import { getApps, initializeApp } from 'firebase-admin/app';
import { getDataConnect, type DataConnect } from 'firebase-admin/data-connect';
import { connectorConfig } from '@dataconnect/admin-generated';

let dataConnect: DataConnect | undefined;

// Lazy singleton: reads env vars on first use, not at import time, so it
// always runs after server.ts has called dotenv.config().
export function getDataConnectClient(): DataConnect {
  if (!dataConnect) {
    const firebaseApp = getApps()[0] ?? initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    dataConnect = getDataConnect(connectorConfig, firebaseApp);
  }
  return dataConnect;
}
