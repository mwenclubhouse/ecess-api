import { Bot } from "./utils/bot";
import { Message } from "discord.js";
import { Api } from "./utils/api";
import cron from "node-cron";
import { Drive } from "./google/drive";
import {requestIO, requestUser, requestCalendar, requestInit} from "./requests";
import {MyFbDb} from "./google/myFb/myFbDb";


requestInit();
requestCalendar();
requestIO();
requestUser();

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
    cron.schedule('0 0 */12 * * *', async function () {
        console.log("sending discord events to fb");
        const events = await Bot.ecess.discordCalendar(undefined);
        await MyFbDb.addDiscordEvents(events);
    });
}


Api.listen();
Bot.login().then(async () => {
    console.log("discord bot is running");
});
