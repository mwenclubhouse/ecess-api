import {Api} from "../utils/api";
import {Request, Response} from "express";
import {MyFbAuth} from "../google/myFb/myFbAuth";
import {decodeIDToken} from "../utils/utils";
import {getAuth} from "firebase-admin/auth";
import {MyFbDb} from "../google/myFb/myFbDb";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

export function requestUser() {

    Api.setPostRoute("/updateUser", async function (req: Request, res: Response) {
        const user = await decodeIDToken(req);
        if (user) {
            const attribute = req.body;
            let properties: any = {};
            if (attribute.name) {
                properties["displayName"] = attribute.name;
            }
            if (attribute.email) {
                properties["email"] = attribute.email;
            }
            await MyFbAuth.default.getAuth().updateUser(user.uid, properties);
            res.send({properties: properties})
        }
        else {
            res.sendStatus(400);
        }
    });

    Api.setPostRoute("/ecess/addUser", async function(req: Request, res: Response) {
        const admin = await decodeIDToken(req);
        if (!admin) {
            res.sendStatus(400);
            return;
        }
        const attribute = req.body;
        let email = attribute["email"] || undefined;
        const organization = attribute["organization"] || undefined;
        if (!email || !organization) {
            res.sendStatus(400);
            return;
        }
        email = email.replace(/\s/g, '');
        let adminData = undefined;
        try {
            adminData = (await MyFbDb.default.firestone.collection("users").doc(admin.uid).get());
            adminData = adminData.data() || {};
        }
        catch (e) {
            res.sendStatus(400);
            return;
        }
        if (!adminData) {
            res.sendStatus(400);
            return;
        }
        if (!adminData["admin"] && !(adminData["ecess_board_position"] === organization)) {
            res.sendStatus(400);
            return;
        }
        let user = undefined;
        try {
            user = await getAuth().getUserByEmail(email);
        }
        catch (e) {
            res.sendStatus(400);
            return;
        }
        if (!user) {
            res.sendStatus(400);
            return;
        }
        let userData = undefined;
        try {
            userData = await MyFbDb.default.firestone.collection("users").doc(user.uid).get();
            userData = userData.data() || {};
        }
        catch (e) {
            userData = {};
        }
        if (!("ecess_organization" in userData)) {
           userData["ecess_organization"] = {}
        }
        userData["email"] = email;
        if (!("name" in userData)) {
            userData["name"] = user.displayName || "Unknown";
        }
        userData["ecess_organization"][organization] = null;
        await MyFbDb.default.firestone.collection("users").doc(user.uid).set(userData);
        res.sendStatus(200);
    });

    Api.setGetRoute("/members", async (req: any, res: any) => {
        console.log("/members route");
        const user = await decodeIDToken(req);
        console.log({user});
        if (user === undefined) {
            res.send({status: "failure"});
        }
        else {
            res.send({status: "good"});
        }
        console.log('receiving data ...');
        console.log('body is ', req.body);
    });

    Api.setPostRoute("/auth", async (req: any, res: any) => {
        const user = await decodeIDToken(req);
        if (user === undefined) {
            res.send({status: "failure"});
        }
        else {
            res.send({status: "good"});
        }
        console.log('receiving data ...');
        console.log('body is ', req.body);
        res.send(req.body);
    });

}