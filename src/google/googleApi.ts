import {MyFirebase} from "./myFb/myFb";
import {google} from "googleapis";

export class GoogleApi extends MyFirebase {

    protected auth: any;

    constructor(scope: string[]) {
        super();
        this.auth = new google.auth.JWT(
            MyFirebase.appDefault.clientEmail,
            undefined,
            MyFirebase.appDefault.privateKey,
            scope,
        )
    }

}