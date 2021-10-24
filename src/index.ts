import {Request, Response} from "express";
import {Bot} from "./utils/bot";
import {Message} from "discord.js";
import {Api} from "./utils/api";
import {Calendar} from "./utils/calendar";
import * as stream from "stream";


Api.setUse(
    (req: any, res: any, next: any) => {
        res.header("Access-Control-Allow-Origin", "https://www.purdue-ecess.org/*");
        return next();
    }
)

Api.setGetRoute("/", (req: any, res: any) => {
    res.send({
        status: 'development',
        purpose: 'ECE Ambassadors',
        owner: 'Purdue ECE'
    });
});

Api.setGetRoute("/calendar/:org/:cal", async (req: Request, res: Response) => {
    const day = req.query.day;
    const org = req.params.org;
    const cal = req.params.cal;
    let error = true;
    if (org === "ambassadors") {
        if (typeof day === "string" || day == undefined) {
            res.send(await Calendar.getCalendarEvents(day));
            error = false;
        }
    }

    if (error) {
        res.send({error: "calendar is not found"})
        res.statusCode = 400;
    }
});

Api.setGetRoute("/bot/announcements", async (req: Request, res: Response) => {
    const response = await Bot.getAnnouncements();
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

Bot.setOnMessageCreate(async (message: Message) => {
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

