import * as fa from "firebase-admin";

export const admin = fa.initializeApp();
export const firestore = admin.firestore();
