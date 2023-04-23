# Api Gateway + Discord Bot for ECE Student Society

This programs currently runs on Google Cloud!

### Prerequisite
1. Google Cloud Service Account. In addition, the Google Calendar API enabled for Project.
2. Firebase Admin Account attached to Google Cloud (Firebase is the Database of Choice)
3. Discord Bot Secret Key. This allows the program to control the bot + let the API Gateway gets information for the bot.

### Running the Program

Setting the environment variables
```text
DISCORD_TOKEN=[TOKEN FROM DISCORD] 
DISCORD_ANNOUNCEMENT_CHANNEL=[ID OF CHANNEL WHERE BOT SHOULD READ FROM]
AMBASSADOR_GUILD_ID=[ID OF THE AMBASSADOR SERVER]
AMBASSADOR_ANNOUNCEMENT_CHANNEL=[ID OF THE AMBASSADOR ANNOUNCEMENTS]
ECESS_GUILD_ID=[ID OF THE ECESS SERVER]
GOOGLE_APPLICATION_CREDENTIALS=[LOCATION OF GOOGLE KEY FILE]
```

Local Development
```bash
$ npm install
$ npm run dev
```

Production
```bash
$ npm install
$ npm run build
$ npm run start
```
