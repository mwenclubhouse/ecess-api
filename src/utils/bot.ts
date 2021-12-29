import {
    Awaitable,
    Channel,
    Client,
    Guild,
    Intents,
    Message,
    NewsChannel,
    PartialMessage,
} from "discord.js";
import {config} from "dotenv";
import axios from "axios";
import moment, {Moment} from "moment";
import {linkify} from "./utils";

config();

export class Bot {

    static ambassador: Bot = new Bot(process.env.AMBASSADOR_GUILD_ID);
    static ecess: Bot = new Bot(process.env.ECESS_GUILD_ID);
    static client: Client | undefined = undefined;
    private readonly guild: Promise<Guild> | undefined;
    private guild_id: string;
    private events: { call: undefined | Moment; data: undefined | any[] };

    constructor(guild: string | undefined) {
        const client = Bot.initClient();
        this.guild = guild ? client.guilds.fetch(guild): undefined;
        this.guild_id = guild || "";
        this.events = {
            call: undefined, 
            data: undefined
        }
    }

    static initClient() {
        if (Bot.client === undefined) {
            Bot.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});
        }
        return Bot.client;
    }


    setOnMessageCreate(func: (
        message: Message
    ) => Awaitable<void>) {
        if (Bot.client) {
            Bot.client.on("messageCreate", func);
        }
    }

    setOnMessageDelete(func: (
        message: Message | PartialMessage
    ) => Awaitable<void>) {
        if (Bot.client) {
            Bot.client.on("messageDelete", func);
        }
    }

    setOnMessageUpdate(func: (
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ) => Awaitable<void>) {
        if (Bot.client) {
            Bot.client.on("messageUpdate", func);
        }
    }

    async getAnnouncements() {
        if (Bot.client === undefined) {
            return [];
        }
        const response = [];
        if (!process.env.AMBASSADOR_ANNOUNCEMENT_CHANNEL) {
            return [];
        }
        const channel : Channel | null = await Bot.client.channels.fetch(process.env.AMBASSADOR_ANNOUNCEMENT_CHANNEL || "");
        if (!this.guild) {
            return [];
        }
        const guild = await this.guild;
        if (! (channel instanceof NewsChannel)) {
            return [];
        }
        const messages = await channel.messages.fetch({limit: 100});
        for (let k of messages) {
            const m: Message = k[1];
            const name = await guild.members.fetch(m.author.id);
            console.log(-1 != ["Giselle"].indexOf(name.displayName));
            response.push({
                author: name.displayName,
                content: Bot.HTMLParser(m.content),
                date: m.editedAt || m.createdAt,
                label: -1 != ["Giselle", "Leigh Ann"].indexOf(name.displayName) ? "Advisor": (name.displayName === "Sara Hui" ? "Head Ambassador": "Ambassador")
            });
        }
        return response;
    }

    static HTMLParser(message: String): string {
        let words = message.split(' ');
        let new_message = "";
        let new_word;

        for (let word of words) {
            //test case 1: link -> <a href =*link*>*link*</a> PASSES
            if (word.startsWith('https://')) {
                new_word = "<a href=" + word + ">" + word + "</a>"
                new_message += new_word
            }
            //TODO test case 2 (bold)
            else if (word.includes("\n")) {
                //test case 3: \n -> <br> PASSES
                new_word = word.split("\n").join("<br>") // find replaceAll function?
                new_message += new_word
            }
            else {
                new_message += word
            }
            //TODO test case 4 (@)
            //TODO test case 5 (images)
            new_message += " "
        }
        return new_message.trim()
    }

    static async login() {
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            console.log("Discord Token Not Found");
            return;
        }
        const client = this.initClient();
        if (!client) {
            return;
        }
        await client.login();
    }

    async discordCalendar(date: string | undefined, ignore=undefined) {
        const start_date: Moment  = (date) ? moment(date).startOf('day') : moment().add(1, "days").startOf('day');
        const end_date: Moment | undefined = (date) ?
            moment(date).endOf('day'):
            undefined;

        let response: any = this.events.data;
        if (this.events.call === undefined || moment().unix() - this.events.call.unix() > 60) {
            response = await axios.get(
                'https://discord.com/api/guilds/' + this.guild_id + '/scheduled-events',
                {
                    headers: {
                        Authorization: `Bot ${process.env.DISCORD_TOKEN}`
                    }
                }
            );
            if (response != undefined && response.data != undefined) {
                this.events = {
                    call: moment(),
                    data: response
                }
            }

        }
        const parsed_events: any[] = [];
        response?.data.forEach((item: any) => {
            const start_string = item.scheduled_start_time;
            const end_string = item.scheduled_end_time;
            const event_start: Moment = (start_string) ?
                moment(start_string).startOf('day') :
                moment()
                    .add(1, "days")
                    .startOf('day');
            if (end_date === undefined ||
                (start_date.unix() <= event_start.unix() && event_start.unix() <= end_date.unix())
            ) {
                parsed_events.push({
                    title: item.name,
                    start: {
                        dateTime: start_string,
                        timeZone: "America/Indiana/Indianapolis"
                    },
                    end: {
                        dateTime: end_string,
                        timeZone: "America/Indiana/Indianapolis"
                    },
                    id: item.id,
                    content: linkify(item.description.replace("\n", "<br/>")),
                    location: item.entity_metadata.location || undefined,
                    service: {
                        name: 'discord',
                        guild: 'ecess',
                    }
                });
            }
        });
        return parsed_events;
    }

}