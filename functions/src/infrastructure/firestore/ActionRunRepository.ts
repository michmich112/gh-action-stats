import { firestore } from "../../config/firebase.config";
import ActionRun from "../../domain/ActionRun.type";
import IFirestoreRepository from "../../domain/IRepository";

class ActionRunRepository implements IFirestoreRepository {
  collection: string;

  constructor() {
    this.collection = "runs";
  }

  public async create(run: ActionRun): Promise<void> {
    await firestore.collection(this.collection).add(run);
  }

  public async getByCreatorAndName(creator: string, name: string): Promise<ActionRun[]> {
    const snapshot = await firestore.collection(this.collection)
      .where("creator", "==", creator)
      .where("name", "==", name)
      .get();

    if (snapshot.empty) return [];
    return snapshot.docs.map((s) => s.data() as ActionRun);
  }
}

const instance = new ActionRunRepository();

export default instance;

