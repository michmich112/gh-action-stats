import { firestore } from "../../config/firebase.config";
import Action, { hydrate, deHydrate } from "../../domain/Action.type";
import IFirestoreRepository from "../../domain/IRepository";

class ActionRepository implements IFirestoreRepository {
  collection: string;
  constructor() {
    this.collection = "actions";
  }

  public async add(action: Action): Promise<void> {
    await firestore.collection(this.collection)
      .doc(`${action.creator}:${action.name}`)
      .set(deHydrate(action), { merge: true });
  }

  public async getActionsByCreator(username: string): Promise<Action[]> {
    const snapshot = await firestore.collection(this.collection)
      .where("creator", "==", username)
      .get();
    const actions: Action[] = [];
    if (!snapshot.empty) snapshot.forEach((doc) => actions.push(hydrate(doc.data())));
    return actions;
  }

  public async getActionByCreatorAndName(username: string, actionName: string): Promise<Action | null> {
    // const snapshot = await firestore.collection(this.collection)
    //  .doc(`${username}:${actionName}`)
    //  .get();

    // TODO: remove comments after test
    const snapshot = await firestore.collection(this.collection)
      .where("creator", "==", username)
      .where("name", "==", actionName)
      .get();
    if (snapshot.empty) return null;
    return hydrate(snapshot.docs[0].data());
    // if (!snapshot.exists) return null;
    // return hydrate(snapshot.data());
  }

  public async setBadgesIsUpdating(username: string, actionName: string, value: boolean): Promise<void> {
    await firestore.collection(this.collection)
      .doc(`${username}:${actionName}`)
      .set({ badges: { is_updating: value } }, { merge: true });
  }

  public async setBadgesLastUpdate(username: string, actionName: string, value: Date): Promise<void> {
    await firestore.collection(this.collection)
      .doc(`${username}:${actionName}`)
      .set({ badges: { last_update: value.toISOString() } }, { merge: true });
  }
}

const instance = new ActionRepository();

export default instance;

