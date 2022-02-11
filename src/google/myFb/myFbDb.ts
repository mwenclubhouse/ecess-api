import {getFirestore} from "firebase-admin/firestore";
import {MyFirebase} from "./myFb";

export class MyFbDb extends MyFirebase {

    static default: MyFbDb = new MyFbDb();
    public firestone: FirebaseFirestore.Firestore;

    private constructor() {
        super();
        this.firestone = getFirestore(MyFirebase.app);
    }

    static async testing() {
        const response = await this.default.firestone.collection("testing").doc("ibf39bPxk3il3uQtzacL").get();
        console.log(response);
    }

    static async addDiscordEvents(events: any[]) {
        const promises: any[] = [];
        events.forEach((item) => {
            promises.push(this.default.firestone.collection("events").doc(item.id).set(item));
        });
        await Promise.all(promises);
    }

    static async getEvents(dateStr: string | undefined) {
        if (dateStr === undefined) {
            return [];
        }
        const date = new Date(dateStr);
        if (date.getTime() > (new Date()).getTime()) {
            return [];
        }
        const query = date.toISOString().split('T')[0] + "T99:9:99:999Z";
        const response = await this.default.firestone
            .collection("events")
            .where("end.dateTime", "<=",  query)
            .orderBy("end.dateTime", "asc").get();
        const items: any[] = [];
        const startWith = date.toISOString().split('T')[0];
        response.forEach((item) => {
            const json = item.data();
            if (json.end.dateTime.startsWith(startWith)) {
                items.push(item.data());
            }
        });
        return items;
    }
}