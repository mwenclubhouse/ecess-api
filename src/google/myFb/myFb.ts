import {applicationDefault, initializeApp} from 'firebase-admin/app';
import {App} from "firebase-admin/lib/app/core";
import {credential} from "firebase-admin";

export class MyFirebase {

    static app: App;
    static appDefault: any;

    constructor() {
        if (MyFirebase.app === undefined) {
            if (process.env.GOOGLE_APPLICATION_JSON) {
                MyFirebase.appDefault = credential.cert(JSON.parse(process.env.GOOGLE_APPLICATION_JSON));
            }
            else {
                MyFirebase.appDefault = applicationDefault();
            }
            MyFirebase.app = initializeApp({
                credential: MyFirebase.appDefault
            });
        }
    }
}
