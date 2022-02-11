import {Bot} from "../src/utils/bot";
import {MyFbDb} from "../src/google/myFb/myFbDb";


const main = async () => {
    const item = await MyFbDb.getEvents(undefined);
    console.log(item);
}
main().then();
