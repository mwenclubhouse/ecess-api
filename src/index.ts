import {Request, Response} from "express";
import {Bot} from "./utils/bot";
import {Message} from "discord.js";
import {Api} from "./utils/api";
import {Calendar} from "./utils/calendar";
import * as stream from "stream";
import moment from "moment/moment";
import {MyFbStorage} from "./myFb/myFbStorage";
import fs from "fs";


Api.setUse(
    (req: any, res: any, next: any) => {
        res.header("Access-Control-Allow-Origin", "*");
        return next();
    }
)


Api.setGetRoute("/", (req: any, res: any) => {
    res.send({
        status: 'development',
        purpose: 'ECE Student Society',
        owner: 'Purdue ECE'
    });
});

Api.setGetRoute("/bucket", async (req: any, res: any) => {
    // const storage = MyFbStorage.loadStorage();
    const image = req.query.image;
    if (typeof image === "string") {
        // const link = await storage.getFileLink(image) ;
        res.send({
            image: `https://ecess-api.matthewwen.com/blob?path=${image}`
        })
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


Api.setGetRoute("/bot/announcements", async (req: Request, res: Response) => {
    const response = await Bot.ambassador.getAnnouncements();
    res.send(response);
});


Api.setWs('/ws', (ws_param: any, req: Request) => {
    ws_param.on("message", (msg: string) => {
        console.log(msg);
    })
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
    console.log("message", message.content);
    // message.channel.send("testing deployment");
});


Api.listen();
Bot.login().then(async () => {
    console.log("discord bot is running");
});

