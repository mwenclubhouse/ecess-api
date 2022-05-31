# Api Gateway + Discord Bot for ECE Student Society

This programs currently runs on Google Cloud!

### Prerequisite
1. Google Cloud Service Account. In addition, the Google Calendar API enabled for Project.
2. Firebase Admin Account attached to Google Cloud (Firebase is the Database of Choice)
3. Discord Bot Secret Key. This allows the program to control the bot + let the API Gateway gets information for the bot.

### Running the Program

Setting the environment variables: 
/home/mwenclubhouse/environments/ecess-prod.env.list
```text
ENV=[production if it is in production]
DISCORD_TOKEN=[TOKEN FROM DISCORD] 
ECESS_GUILD_ID=[ID OF THE ECESS SERVER]
GOOGLE_APPLICATION_CREDENTIALS=[LOCATION OF GOOGLE KEY FILE]
GOOGLE_APPLICATION_JSON=[JSON of Firebase Admin, needed if GOOGLE_APPLICATION_CREDENTIALS is not used]
```

```bash
$ sudo docker run -d  \
--env-file /home/mwenclubhouse/environments/ecess-prod.env.list \
-v /home/mwenclubhouse/ecess:/usr/src/app/bucket \
--name ecess \
--restart always \
-p 3000:8000 \
ghcr.io/purdue-ecess/ecess-api:main"
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
