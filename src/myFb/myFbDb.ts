import {getFirestore} from "firebase-admin/firestore";
import {MyFirebase} from "./myFb";

export class MyFbDb extends MyFirebase {

    static default: MyFbDb = new MyFbDb();
    private firestone: FirebaseFirestore.Firestore;

    private constructor() {
        super();
        this.firestone = getFirestore(MyFirebase.app);
    }

    static async testing() {
        const response = await this.default.firestone.collection("testing").doc("ibf39bPxk3il3uQtzacL").get();
        console.log(response);
    }
}