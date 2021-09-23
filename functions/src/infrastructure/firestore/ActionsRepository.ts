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
      .doc(`${action.creator}\/${action.name}`)
      .set(action, { merge: true });
  }

  public async getActionsByCreator(username: string): Promise<Action[]> {
    const snapshot = await firestore.collection(this.collection)
      .where('creator', '==', username)
      .get()
    const actions: Action[] = [];
    snapshot.forEach(doc => actions.push(doc.data() as Action));
    return actions;
  }
}

const instance = new ActionRepository();

export default instance;

