import {applicationDefault, initializeApp} from 'firebase-admin/app';
import {App} from "firebase-admin/lib/app/core";

export class MyFirebase {

    static app: App;
    static appDefault: any;

    constructor() {
        if (MyFirebase.app === undefined) {
            MyFirebase.appDefault = applicationDefault();
            MyFirebase.app = initializeApp({
                credential: MyFirebase.appDefault
            });
        }
    }
}
