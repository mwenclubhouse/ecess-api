/*
Image Resizer: https://fireship.io/lessons/image-thumbnail-resizer-cloud-function/
 */
import { getStorage, Storage } from "firebase-admin/storage";
import {Bucket, File, Notification} from '@google-cloud/storage';
import {MyFirebase} from "./myFb";
import {tmpdir} from 'os';
import {join, dirname} from 'path';
import sharp from 'sharp';
import * as fs from 'fs-extra';
import {getSizeAndFileName} from "../../utils/utils";

export class MyFbStorage extends MyFirebase {

    private readonly storage: Storage;
    private readonly bucket: Bucket;

    private static default: MyFbStorage | undefined;


    private constructor() {
        super();
        this.storage = getStorage(MyFirebase.app);
        this.bucket = this.storage.bucket("gs://purdue-ecess.appspot.com");
    }

    async listDir(prefix: string) {
        let [files] = await this.bucket.getFiles({prefix});
        return files;
    }

    async listImgLinksByPath(path: string, minSize: number, querySize: number=100) {
        const allImg = await this.listImgByPath(path, minSize);
        const res = [];
        for (let i = 0; i < Math.min(allImg.length, querySize); i++) {
            const link = await this.getFileLinkByFile(allImg[i].fbFile);
            res.push({link, ref: allImg[i].fileName});
        }
        return res;
    }

    async listImgByPath(path: string, minSize: number = 1080) {
        const allFiles = await this.listDir(`img/${path}`);
        const mapThumbImg = new Map();
        allFiles.forEach((item) => {
            const fileName: string = item.name.split('/').pop() || "";
            if (fileName != "") {
                if (fileName.startsWith(`thumb@`)) {
                    const fileAttribute = getSizeAndFileName(item);
                    const currentImg = mapThumbImg.get(fileAttribute.fileName);
                    if ( currentImg === undefined ||
                        (fileAttribute.size >= minSize && fileAttribute.size < currentImg.size)) {
                        mapThumbImg.set(fileAttribute.fileName, fileAttribute);
                    }
                }
                else if (!fileName.startsWith(`thumb@`)) {
                    if (mapThumbImg.has(fileName)) {
                        mapThumbImg.set(fileName, {
                            size: Infinity,
                            fileName,
                            fbFile: item
                        });
                    }
                }
            }
        })
        const response: any[] = [];
        mapThumbImg.forEach((v, k) => {
            response.push(v);
        });
        return response;
    }

    async resizeImgObjFromFb(object: any) {
        const filePath = object.name;
        const fileName = filePath.split('/').pop();
        const bucketDir = dirname(filePath);

        const workingDir = join(tmpdir(), 'thumbs');
        const tmpFilePath = join(workingDir, fileName);

        if (fileName.includes('thumb@')) {
            return false;
        }

        // 1. Ensure thumbnail dir exists
        await fs.ensureDir(workingDir);

        // 2. Download Source File
        await object.download({
            destination: tmpFilePath
        });

        return await this.resizeAndUpload(fileName, workingDir,
            tmpFilePath, bucketDir);
    }

    async resizeAndUpload(
        fileName: string, workingDir: string, tmpFilePath: string,
        bucketDir: string) {

        // 3. Resize the images and define an array of upload promises
        const sizes = [240, 480, 720, 1080];

        const uploadPromises = sizes.map(async size => {
            const thumbName = `thumb@${size}_${fileName}`;
            let thumbPath = join(workingDir, thumbName);

            // Resize source image
            try {
                await sharp(tmpFilePath)
                    .resize({
                        fit: sharp.fit.contain,
                        width: size
                    })
                    .toFile(thumbPath);

                // Upload to GCS
                return this.bucket.upload(thumbPath, {
                    destination: join(bucketDir, thumbName)
                });
            }
            catch (e) {
                console.log({fileName, e});
            }

        });
        uploadPromises.push(new Promise(resolve => {
            resolve(this.bucket.upload(tmpFilePath, {
                destination: join(bucketDir, fileName)
            }))
        }));

        // 4. Run the upload operations
        await Promise.all(uploadPromises);

        // 5. Cleanup remove the tmp/thumbs from the filesystem
        return fs.remove(workingDir);
    }

    public async fileExists(path: string) {
        const [exists] = await this.bucket.file(path).exists();
        return exists;
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

    getFile(fileKey: string) {
        return this.bucket.file(fileKey);
    }

    async getFileLink(key: string) {
        const file = this.bucket.file(key);
        return await this.getFileLinkByFile(file, new Date((new Date()).getTime() + 10 * 60000));
    }

    async getFileLinkByFile(file: File, expires: Date | string = "04-20-6969") {
        return new Promise((resolve, reject) => {
            return file.getSignedUrl({
                action: 'read',
                expires
            }).then(signedUrls => {
                resolve(signedUrls[0]);
            });
        })
    }

}