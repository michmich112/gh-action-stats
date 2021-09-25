import { firestore } from "../../config/firebase.config";
import IFirestoreRepository from "../../domain/IRepository";
import User from "../../domain/User.type";

class UserRepository implements IFirestoreRepository {
  public collection: string;

  constructor() {
    this.collection = "users";
  }

  public async create(user: User): Promise<void> {
    await firestore.collection(this.collection)
      .doc(user.uid)
      .set(user);
  }

  public async update(user: User): Promise<{ success: boolean, data?: User }> {
    await firestore.collection(this.collection)
      .doc(user.uid)
      .set(user, { merge: true });
    const uUser = await this.getByUid(user.uid);
    return {
      success: uUser === null ? false : true,
      data: uUser === null ? undefined : user,
    };
  }

  public async getByUid(uid: string): Promise<User | null> {
    const snapshot = await firestore.collection(this.collection).doc(uid).get();
    const userData = snapshot.data();
    if (userData) return userData as User;
    else return null
  }

  public async existsByUid(uid: string): Promise<boolean> {
    const snapshot = await firestore.collection(this.collection).doc(uid).get();
    return snapshot.exists;
  }
}

const instance = new UserRepository();

export default instance;

