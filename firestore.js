import admin from 'firebase-admin';

const COLLECTION = 'news_published';
let db = null;

export function initFirestore() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT nao definido');

  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
}

function encodeId(guid) {
  return Buffer.from(guid).toString('base64url').slice(0, 200);
}

export async function isAlreadyProcessed(guid) {
  const doc = await db.collection(COLLECTION).doc(encodeId(guid)).get();
  return doc.exists;
}

export async function markProcessed(guid, source, status, postId = null) {
  await db.collection(COLLECTION).doc(encodeId(guid)).set({
    guid,
    source,
    status,
    postId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}
