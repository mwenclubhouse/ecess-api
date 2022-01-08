// import ECESS_MEMBERS from data_people;
import { MyFbDb } from "../src/google/myFb/myFbDb";
import { MyFbAuth } from "../src/google/myFb/myFbAuth";
import { Auth , UserRecord} from "firebase-admin/auth";
import { ECESS_MEMBERS } from "./data";

function makeid(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const usersDb = MyFbDb.default.firestone.collection('users');
const auth: Auth = MyFbAuth.default.getAuth();
const main = async () => {
    for (let i = 0; i < ECESS_MEMBERS.length; i++) {
        const item = ECESS_MEMBERS[i];
        let user: UserRecord | undefined = undefined;
        if (item.email) {
            try {
                user = await auth.getUserByEmail(item.email);
            }
            catch (e) {
                const password = makeid(10);
                user = await auth.createUser({
                    displayName: item.name,
                    email: item.email,
                    emailVerified: false,
                });
                console.log(`email: ${item.email}, password: ${password}`);
            }
        }
        else {
            user = await auth.createUser({
                displayName: item.name,
                emailVerified: false
            });
        }
        if (user) {
            const addUser = usersDb.doc(user.uid);
            addUser.set(item);
        }
        // if (user)
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
