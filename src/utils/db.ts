import { initializeApp } from 'firebase-admin/app';
import {credential} from "firebase-admin";
import {App} from "firebase-admin/lib/app/core";
import {getFirestore} from "firebase-admin/firestore";

export class Db {

    static default: Db = new Db();
    app: App;
    private firestone: FirebaseFirestore.Firestore;

    private constructor() {
        this.app = initializeApp({
            credential: credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}"))
        })
        this.firestone = getFirestore(this.app);
    }

    static async testing() {
        const response = await this.default.firestone.collection("testing").doc("ibf39bPxk3il3uQtzacL").get();
        console.log(response);
    }
}