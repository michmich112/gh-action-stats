import { firestore } from "../../config/firebase.config";
import Action from "../../domain/Action.type";
import IFirestoreRepository from "../../domain/IRepository";

class ActionRepository implements IFirestoreRepository {
  collection: string;
  constructor() {
    this.collection = "actions";
  }

  public async add(action: Action): Promise<void> {
    await firestore.collection(this.collection)
      .doc(`${action.creator}:${action.name}`)
      .set(action, { merge: true });
  }

  public async getActionsByCreator(username: string): Promise<Action[]> {
    const snapshot = await firestore.collection(this.collection)
      .where("creator", "==", username)
      .get();
    const actions: Action[] = [];
    if (!snapshot.empty) snapshot.forEach((doc) => actions.push(doc.data() as Action));
    return actions;
  }

  public async getActionByCreatorAndName(username: string, actionName: string): Promise<Action | null> {
    const snapshot = await firestore.collection(this.collection)
      .where("creator", "==", username)
      .where("name", "==", actionName)
      .get();
    if (snapshot.empty) return null;
    console.debug('snapshot', snapshot.docs);
    return snapshot.docs[0].data() as Action;
  }
}

const instance = new ActionRepository();

export default instance;

