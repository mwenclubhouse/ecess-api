import {MyFirebase} from "./myFb";
import {getAuth} from 'firebase-admin/auth';

export class MyFbAuth extends MyFirebase {

    static default: MyFbAuth = new MyFbAuth();

    private constructor() {
        super();
    }

    public async loginWithEmailAndPwd(email: string, pwd: string) { 
        const idToken = "hi there";
        const response = await getAuth().verifyIdToken(idToken)
        return response;
    }

}