import { firestore } from "../../config/firebase.config";
import IFirestoreRepository from "../../domain/IRepository";
import User from "../../domain/User.type";

class UserRepository implements IFirestoreRepository {
  public collection: string;

  constructor() {
    this.collection = 'users';
  }

  public async create(user: User): Promise<void> {
    await firestore.collection(this.collection)
      .doc(user.uid)
      .create(user);
  }

  public async update(user: User): Promise<{ success: boolean, data?: User }> {
    await firestore.collection(this.collection)
      .doc(user.uid)
      .set(user, { merge: true });
    return await this.getByUid(user.uid);
  }

  public async getByUid(uid: string): Promise<{ success: boolean, data?: User }> {
    const snapshot = await firestore.collection(this.collection).doc(uid).get();
    const userData = snapshot.data();
    if (userData) {
      return {
        success: true,
        data: userData as User
      };
    } else {
      return {
        success: false,
      }
    }
  }

  public async existsByUid(uid: string): Promise<boolean> {
    const snapshot = await firestore.collection(this.collection).doc(uid).get();
    return snapshot.exists;
  }

}

const instance = new UserRepository();

export default instance;

