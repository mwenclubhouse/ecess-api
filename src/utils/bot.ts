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

config();

export class Bot {

    static default: Bot = new Bot();
    client: Client
    private guild: Promise<Guild>;

    private constructor() {
        this.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});
        this.guild = this.client.guilds.fetch(process.env.DISCORD_GUILD_ID || "");
    }


    static setOnMessageCreate(func: (
        message: Message
    ) => Awaitable<void>) {
        this.default.client.on("messageCreate", func);
    }

    static setOnMessageDelete(func: (
        message: Message | PartialMessage
    ) => Awaitable<void>) {
        this.default.client.on("messageDelete", func);
    }

    static setOnMessageUpdate(func: (
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ) => Awaitable<void>) {
        this.default.client.on("messageUpdate", func);
    }

    static async getAnnouncements() {
        const response = [];
        const channel : Channel | null = await this.default.client.channels.fetch(process.env.DISCORD_ANNOUNCEMENT_CHANNEL || "");
        const guild = await this.default.guild;
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
        if (token) {
            await this.default.client.login();
        }
        else {
            console.log("Discord Token Not Found");
        }
    }

}