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
    private readonly guild: Promise<Guild>;
    private guild_id: string;
    private events: { call: undefined | Moment; data: undefined | any[] };

    constructor(guild: string | undefined) {
        const client = Bot.initClient();
        this.guild = client.guilds.fetch(guild || "");
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
        const channel : Channel | null = await Bot.client.channels.fetch(process.env.DISCORD_ANNOUNCEMENT_CHANNEL || "");
        const guild = await this.guild;
        if (channel instanceof NewsChannel) {
            const messages = await channel.messages.fetch({limit: 100});
            for (let k of messages) {
                const m: Message = k[1];
                const name = await guild.members.fetch(m.author.id);
                console.log(-1 != ["Giselle"].indexOf(name.displayName));
                response.push({
                    author: name.displayName,
                    content: m.content,
                    date: m.editedAt || m.createdAt,
                    label: -1 != ["Giselle", "Leigh Ann"].indexOf(name.displayName) ? "Advisor": (name.displayName === "Sara Hui" ? "Head Ambassador": "Ambassador")
                });
            }
        }
        return response;
    }

    static async login() {
        const token = process.env.DISCORD_TOKEN;
        const client = this.initClient();
        if (token && client) {
            await client.login();
        }
        else {
            console.log("Discord Token Not Found");
        }
    }

    async discordCalendar(date: string | undefined) {
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
            if (end_date === undefined || event_start < end_date) {
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