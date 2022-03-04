import {GoogleApi} from "./googleApi";
import {google} from "googleapis";
import fs from "fs";
import * as fsE from 'fs-extra';
import {dirname, join} from "path";
import {tmpdir} from "os";
import {MyFbStorage} from "./myFb/myFbStorage";
import {file} from "googleapis/build/src/apis/file";

const SCOPES = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
];

export class Drive extends GoogleApi {

    private readonly api: any;
    private static default: Drive = new Drive();
    private running: boolean = false;

    private constructor() {
        super(SCOPES);
        this.api = google.drive({version: "v3", auth: this.auth});
    }

    static loadDrive() {
        return Drive.default;
    }

    async uploadDriveToFb(force=false) {
        this.running = true;
        if (this.running) {
            return
        }
        const drive = Drive.loadDrive();
        const response = await drive.listFiles();
        for (let i = 0; i < response.length; i++) {
            await drive.resizeImgObj(response[i], force);
        }
        this.running = false;
    }

    listFilesInDir(folderId: string | undefined) : Promise<any[]>{
        return new Promise(resolve => {
            if (folderId == undefined) {
                resolve([]);
            }
            this.api.files.list({
                q: `parents = '${folderId}'`,
                pageSize: 1000
            }, (err: any, res: any) => {
                if (err) {
                    resolve([]);
                }
                resolve(res.data.files);
            });
        });
    }

    listAllFiles() : Promise<any[]> {
        return new Promise(resolve => {
            this.api.files.list({
                q: `mimeType ='image/jpeg'`
            }, (err: any, res: any) => {
                resolve(res.data.files);
            });
        });
    }

    async resizeImgObj(driveObj: { name?: any; id?: any; }, force=false) {
        const storage = MyFbStorage.loadStorage();
        const fileExists = await storage.fileExists(driveObj.name) && !force;
        if (!driveObj.name?.startsWith("img/") || fileExists) {
            return new Promise(resolve => resolve(null));
        }
        const filePath = driveObj.name;
        const fileName = filePath.split('/').pop();
        const bucketDir = dirname(filePath);

        const workingDir = join(tmpdir(), 'thumbs');
        const tmpFilePath = join(workingDir, fileName);

        // 1. Ensure thumbnail dir exists
        await fsE.ensureDir(workingDir);

        // 2. Download Source File
        await this.downloadFile(driveObj, tmpFilePath);

        return await MyFbStorage.loadStorage().resizeAndUpload(
            fileName, workingDir, tmpFilePath, bucketDir
        );
    }

    // https://github.com/googleapis/google-api-nodejs-client/blob/main/samples/drive/download.js
    async downloadFile(driveObj: { name?: any; id?: any }, tmpFilePath: any) {
        return new Promise((resolve, reject) => {
            this.api.files
                .get({fileId: driveObj.id, alt: 'media'}, {responseType: 'stream'})
                .then((res: any) => {
                    let dest = fs.createWriteStream(tmpFilePath);
                    res.data.on('end', () => {
                            resolve(tmpFilePath);
                        })
                        .on('error', (err: any) => {
                            console.error('Error downloading file.');
                            reject(err);
                        })
                        .pipe(dest);
                });
        })
    }

    async listFiles() {
        const files: any[] = [];
        const folderIds = [{
            id: "1fhXo4ED9EizyMHzZynuX-3-Egaltc2qk",
            path: ""
        }];
        const folderMimeType = "application/vnd.google-apps.folder";
        while (folderIds.length > 0) {
            const folderId = folderIds.pop() || {id: "", path: ""};
            const folderFiles: any[] = await this.listFilesInDir(folderId.id);
            for (let i = 0; i < folderFiles.length; i++) {
                const item = folderFiles[i];
                const key = `${folderId.path}/${item.name}`;
                if (item.mimeType === folderMimeType) {
                    folderIds.push({
                        id: item.id,
                        path: key
                    });
                }
                else {
                    files.push({
                        ...item,
                        name: key.substring(1)
                    });
                }
            }
        }
        return files;
    }

}
