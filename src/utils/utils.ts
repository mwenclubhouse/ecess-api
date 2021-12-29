// https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
import { File } from '@google-cloud/storage';


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