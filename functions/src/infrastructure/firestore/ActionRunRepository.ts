import {firestore} from "../../config/firebase.config";
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
}

const instance = new ActionRunRepository();

export default instance;

