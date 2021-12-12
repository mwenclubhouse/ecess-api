import { getStorage, Storage} from "firebase-admin/storage";
import { Bucket } from '@google-cloud/storage';
import {MyFirebase} from "./myFb";

export class MyFbStorage extends MyFirebase{

    private readonly storage: Storage;
    private readonly bucket: Bucket;

    private static default: MyFbStorage | undefined;

    private constructor() {
        super();
        this.storage = getStorage(MyFirebase.app);
        this.bucket = this.storage.bucket("gs://purdue-ecess.appspot.com");
    }

    public static loadStorage() {
        if (MyFbStorage.default === undefined) {
            MyFbStorage.default = new MyFbStorage();
        }
        return MyFbStorage.default;
    }

    async uploadFile(fileKey: string, fileName: string | undefined) {
        await this.bucket.upload(fileKey, {destination: fileName})
    }


    async getFileLink(key: string) {
        return new Promise((resolve, reject) => {
            const file = this.bucket.file(key);
            const expires = new Date((new Date()).getTime() + 10 * 60000);
            return file.getSignedUrl({
                action: 'read',
                expires
            }).then(signedUrls => {
                resolve(signedUrls[0]);
            });
        })
    }

}