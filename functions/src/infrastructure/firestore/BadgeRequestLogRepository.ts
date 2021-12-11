import { firestore } from "../../config/firebase.config";
import { BadgeRequest } from "../../domain/BadgeRequest.type";
import IFirestoreRepository from "../../domain/IRepository";

class BadgeRequestLogRepository implements IFirestoreRepository {
  collection = "badge-requests";


  public async create(badgeRequest: BadgeRequest): Promise<void> {
    await firestore.collection(this.collection).add(badgeRequest);
  }
}

const instance = new BadgeRequestLogRepository();

export default instance;

