// https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
import { File } from '@google-cloud/storage';
import {Request} from "express";
import {DecodedIdToken, getAuth, UserRecord} from "firebase-admin/auth";


export function linkify(text: string) {
    const urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
}

export function getSizeAndFileName(fbFile: File) {
    const fileName: string = fbFile.name.split('/').pop() || "";
    const thumbRegex = /thumb@([0-9]*)_/g;
    const ogFileName = fileName.replace(thumbRegex, () => "");
    const found = fileName.match(thumbRegex) || []; // [thumb@(number)_]
    if (found.length <= 0) {
        return {fileName: ogFileName, size: Infinity, fbFile}
    }
    const size = found[0].substr(6); // (number)_
    return {fileName: ogFileName, size: parseInt(size), fbFile};
}

/**
 * Decodes the JSON Web Token sent via the frontend app
 * Makes the currentUser (firebase) data available on the body.
 */
export async function decodeIDToken(req: Request): Promise<(UserRecord | undefined)> {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(idToken);
            return await getAuth().getUser(decodedToken.uid);
        } catch (err) {
            console.log(err);
        }
    }
    return undefined;
}
export function checkOrigin(origin: string): boolean {
    const allowedOrigins = [
        "https://www.purdue-ecess.org",
        "https://purdue-ecess.web.app",
        "https://purdue-ecess.firebaseapp.com"
    ]
    for (let i = 0; i < allowedOrigins.length; i++) {
        if (origin.startsWith(allowedOrigins[i])) {
            return true;
        }
    }
    return origin.startsWith("https://purdue-ecess--pr") && origin.endsWith(".web.app");
}

