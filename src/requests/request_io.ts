import {Api} from "../utils/api";
import fs from "fs";
import stream from "stream";
import {MyFbStorage} from "../google/myFb/myFbStorage";

export function requestIO() {

    Api.setGetRoute("/blob", async (req: any, res: any) => {
        if (process.env.BUCKET_PATH) {
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
        }
        else {
            res.sendStatus(400);
        }
    })

    Api.setGetRoute("/bucket", async (req: any, res: any) => {
        const storage = MyFbStorage.loadStorage();
        const path = req.query.path;
        if (typeof path === "string") {
            const link = await storage.getFileLink(path);
            res.send({
                image: link
            })
        }
        else {
            res.send({
                image: undefined,
                error: "An Error Occurred"
            })
        }
    });

    Api.setGetRoute("/events", async (req: any, res: any) => {
        const storage = MyFbStorage.loadStorage();
        const path = req.query.path;
        const minSize = req.query.minSize || 1080;
        let querySize = req.query.querySize || 100;
        querySize = Math.min(100, querySize);

        if (typeof path === "string") {
            const response = await storage.listImgLinksByPath(path, minSize, querySize);
            res.send(response)
        }
        else {
            res.send({
                image: undefined,
                error: "An Error Occurred"
            })
        }

    });


    Api.setGetRoute("/img", async (req: any, res: any) => {
        const storage = MyFbStorage.loadStorage();
        const path = req.query.path;
        const minSize = req.query.minSize || 1080;
        if (typeof path === "string") {
            try {
                const image = await storage.getImgByName(path, minSize);
                res.send({ image });
            }
            catch (e) {
                console.log({ img_e: e });
                res.sendStatus(400);
            }
        }
        else {
            res.sendStatus(400);
        }
    });
}