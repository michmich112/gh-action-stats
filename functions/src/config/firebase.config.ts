// import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import "firebase-functions";

// if (process.env.FIREBASE_CONFIG === undefined) {
//   console.error("FIREBASE_CONFIG not defined");
// }
// if (functions.config().service_account_secret === undefined) {
//   console.error("serviec_account_secret firebase functions config not defined");
// }

// const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG ?? "");
// adminConfig.credential = cert(JSON.parse(functions.config().service_account_secret));

export const admin = initializeApp();
// export const admin = initializeApp(adminConfig);
export const firestore = getFirestore();
export const storage = getStorage();

