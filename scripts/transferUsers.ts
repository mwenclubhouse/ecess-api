// import ECESS_MEMBERS from data_people;
import { MyFbDb } from "../src/google/myFb/myFbDb";
import { MyFbAuth } from "../src/google/myFb/myFbAuth";
import { Auth , UserRecord} from "firebase-admin/auth";
import { ECESS_MEMBERS } from "./data";

const usersDb = MyFbDb.default.firestone.collection('users');
const auth: Auth = MyFbAuth.default.getAuth();

const getMapByName = async () => {
    const nameMap = new Map();
    const promises: Promise<any>[] = [];
    (await usersDb.get()).docs.map((item) => {
        const data = item.data()
        if (nameMap.has(data.name)) {
            promises.push(usersDb.doc(item.id).delete());
            promises.push(auth.deleteUser(item.id))
        }
        else {
            nameMap.set(data.name, {...data, id: item.id});
        }
    })
    try {
        await Promise.all(promises);
    }
    catch (e) {
        console.log(e);
    }
    return nameMap;
}

const main = async () => {
    const mapByName = await getMapByName();
    for (let i = 0; i < ECESS_MEMBERS.length; i++) {
        const item = ECESS_MEMBERS[i];
        let userData: any = {};
        let user: UserRecord | undefined = undefined;
        if (item.email) {
            try {
                user = await auth.getUserByEmail(item.email);
                userData.id = user.uid;
                userData = mapByName.get(item.name) || {}
            }
            catch (e) {
                userData = mapByName.get(item.name);
            }
        }
        else {
            userData = mapByName.get(item.name);
        }
        if (userData) { // {id: user id} or {name: ... etc..}
            user = await auth.getUser(userData.id)
            await auth.updateUser(userData.id, {
                email: item.email || userData.email,
                emailVerified: true
            })
        }
        else {
            // user is not in database, create a new user
            user = await auth.createUser({
                displayName: item.name,
                email: item.email || undefined,
                emailVerified: item.email !== undefined
            });
            userData = {id: user.uid};
        }

        // merge + add to database
        const mergedData = {...userData, ...item}
        mergedData.ecess_organization = {...(userData.ecess_organization || {}), ...(item.ecess_organization)};
        delete mergedData.id
        const addUser = usersDb.doc(userData.id)
        await addUser.set(mergedData)

        // send email verification
        console.log(mergedData.email);
    }
}

const deleteUsers = async () => {
    const users = await auth.listUsers();
    for (let i = 0; i < users.users.length; i++) {
        const user = users.users[i];
        await auth.deleteUser(user.uid);
    }
}

// deleteUsers().then();
main().then();
