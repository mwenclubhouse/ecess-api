import {Api} from "../utils/api";
import {Request, Response} from "express";
import {MyFbAuth} from "../google/myFb/myFbAuth";
import {decodeIDToken} from "../utils/utils";

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