import express, {Request, Response} from "express";
import {Bot} from "./utils/bot";
import {Message} from "discord.js";
import {Api} from "./utils/api";
import {Calendar} from "./google/calendar";
import * as stream from "stream";
import moment from "moment/moment";
import {MyFbStorage} from "./google/myFb/myFbStorage";
import fs from "fs";
import cron from "node-cron";
import {Drive} from "./google/drive";
import cors from "cors";

function checkOrigin(origin: string): boolean {
    [
        "https://www.purdue-ecess.org",
        "https://purdue-ecess.web.app",
        "https://purdue-ecess.firebaseapp.com"
    ].forEach((item) => {
        if (origin.startsWith(item)) {
            return true;
        }
    })
    const regex = /https:\/\/purdue-ecess--pr[0-9]*-([a-z]|[A-Z]|-|[0-9])*.web.app/
    return regex.test(origin);
}

Api.setUse(cors({
    origin: (origin, callback) => {
        if (origin === undefined && process.env.ENV !== undefined) {
            callback({
                name: "Origin is Undefined",
                message: "Origin Used is Not Defined",
                stack: "Origin Used is Not Defined",
            }, origin);
        }
        else if (process.env.ENV === undefined ||
            origin !== undefined && checkOrigin(origin)) {
            callback(null, origin);
        }
        else {
            callback({
                name: "Origin is Unknown",
                message: "Origin Used is Not Known",
                stack: "Origin Used is Not Known",
            }, origin);
        }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}))
Api.setUse(express.json());


Api.setGetRoute("/", (req: any, res: any) => {
    res.send({
        status: process.env.ENV || 'development',
        purpose: 'ECE Student Society',
        owner: 'Purdue ECE'
    });
});

Api.setPostRoute("/auth", (req: any, res: any) => {
    console.log('receiving data ...');
    console.log('body is ', req.body);
    res.send(req.body);
});

Api.setGetRoute("/img", async (req: any, res: any) => {
    const storage = MyFbStorage.loadStorage();
    const path = req.query.path;
    const minSize = req.query.minSize || 1080;
    if (typeof path === "string") {
        const image = await storage.getImgByName(path, minSize);
        res.send({image});
    }
});

Api.setGetRoute("/bucket", async (req: any, res: any) => {
    const storage = MyFbStorage.loadStorage();
    const path = req.query.path;
    if (typeof path === "string") {
        const link = await storage.getFileLink(path) ;
        res.send({
            image: link
        })
    }
    else {
        res.send({
            image: undefined,
            error: "An Error Occurred"
        })
    }
});

Api.setGetRoute("/events", async (req: any, res: any) => {
    const storage = MyFbStorage.loadStorage();
    const path = req.query.path;
    const minSize = req.query.minSize || 1080;
    let querySize = req.query.querySize || 100;
    querySize = Math.min(100, querySize);

    if (typeof path === "string") {
        const response = await storage.listImgLinksByPath(path, minSize, querySize);
        res.send(response)
    }
    else {
        res.send({
            image: undefined,
            error: "An Error Occurred"
        })
    }

});

Api.setGetRoute("/blob", async (req: any, res: any) => {
    const path = req.query.path;
    const r = fs.createReadStream(process.env.BUCKET_PATH + "/" + path)
    const ps = new stream.PassThrough()
    stream.pipeline(r, ps,
        (err: any) => {
            if (err) {
                console.log(err)
                return res.sendStatus(400);
            }
        })
    ps.pipe(res)
})

Api.setGetRoute("/calendar/:org/:cal", async (req: Request, res: Response) => {
    const day = req.query.day;
    let error = true;
    if (typeof day === "string" || day == undefined) {
        const all_events = await Calendar.getCalendarEvents(day);
        const discord_events = await Bot.ecess.discordCalendar(day);
        discord_events.forEach((item) => {
            all_events.push(item);
        })
        all_events.sort((i1: any, i2: any) => {
            const t1 = moment(i1.start.dateTime);
            const t2 = moment(i2.start.dateTime);
            return t1.unix() - t2.unix();
        })
        res.send(all_events);
        error = false;
    }

    if (error) {
        res.send({error: "calendar is not found"})
        res.statusCode = 400;
    }
});

Api.setGetRoute("/bot/announcements/:org", async (req: Request, res: Response) => {
    const org = req.params.org;
    if (org === "ambassadors") {
        const response = await Bot.ambassador.getAnnouncements();
        res.send(response);
    }
});

Api.setWs('/hello/:world', function(ws: any, req: any, next: any) {

    let interval: NodeJS.Timer | undefined = undefined;
    let message = "sending data back";

    ws.on('open', function () {
        console.log('open connection');
    })
    ws.on('message', function(msg: string) {
        console.log(msg);
        if (msg === "stream" && interval === undefined) {
            interval = setInterval(() => {
                ws.send(message);
            }, 1000);
        }
        else if (msg === "end" && interval) {
            clearInterval(interval);
            interval = undefined;
        }
        else {
            message = msg;
        }
    });
    ws.on("close", function() {
        if (interval) {
            console.log("close interval");
            clearInterval(interval);
            interval = undefined;
        }
    });
    next();
});

Bot.ecess.setOnMessageCreate(async (message: Message) => {
    if (message.author.bot) {
        return;
    }
});

if (process.env.ENV) {
    cron.schedule('0 0 */12 * * *', async function () {
        console.log("sending drive files to fb");
        await Drive.loadDrive().uploadDriveToFb();
    });
}


Api.listen();
Bot.login().then(async () => {
    console.log("discord bot is running");
});
