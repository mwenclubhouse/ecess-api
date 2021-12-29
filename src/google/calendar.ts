import {google} from "googleapis";
import moment, {Moment} from "moment";
import {GoogleApi} from "./googleApi";

const SCOPE = ["https://www.googleapis.com/auth/calendar.readonly",]

export class Calendar extends GoogleApi {
    static default: Calendar = new Calendar();
    private api: any;
    private readonly calendarId: string;

    private constructor() {
        super(SCOPE);
        this.api = google.calendar({version: "v3", auth: this.auth});
        this.calendarId = "1t1ggg1uamf194kmrgftse1nk8@group.calendar.google.com";
    }

    static async getCalendarEvents(date: undefined | string=undefined, ignore=undefined): Promise<any[]> {
        const start_date: Moment  = (date) ? moment(date).startOf('day') : moment().add(1, "days").startOf('day');
        const end_date: Moment | undefined = (date) ? moment(date).endOf('day'): undefined;
        const params: any = {
            calendarId: this.default.calendarId,
            timeMin: start_date.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }
        if (end_date) {
            params["timeMax"] = end_date.toISOString();
        }

        const response: any[] = [];
        try {
            const calendar_data = await this.default.api.events.list(params);
            for (const c of calendar_data.data.items) {
                response.push({
                    title: c.summary,
                    start: c.start,
                    end: c.end,
                    id: c.id,
                    source: {
                        name: 'google'
                    }
                })
            }
        }
        catch (e) {
            console.log(e);
        }
        return response;
    }
}