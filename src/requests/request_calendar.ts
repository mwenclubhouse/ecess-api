import {Api} from "../utils/api";
import { Request, Response } from "express";
import moment from "moment/moment";
import {Calendar} from "../google/calendar";
import {Bot} from "../utils/bot";
import {MyFbDb} from "../google/myFb/myFbDb";


export function requestCalendar() {

    Api.setGetRoute("/calendar/:org/:cal", async (req: Request, res: Response) => {
        const day = req.query.day;
        let error = true;
        if (typeof day === "string" || day == undefined) {
            const all_events = await Calendar.getCalendarEvents(day);
            const discord_events = await Bot.ecess.discordCalendar(day);
            const fb_events = await MyFbDb.getEvents(day);
            discord_events.forEach((item) => {
                all_events.push(item);
            })
            fb_events.forEach((item) => {
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
            res.send({ error: "calendar is not found" })
            res.statusCode = 400;
        }
    });

    Api.setGetRoute("/bot/announcements/:org", async (req: Request, res: Response) => {
        const org = req.params.org;
        try {
            const response = await Bot.ecess.getAnnouncements(org);
            res.send(response);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(400);
        }
    });


}
