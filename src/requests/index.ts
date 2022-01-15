import {requestUser} from "./request_user";
import {requestCalendar} from "./request_calendar";
import {requestIO} from "./request_io";
import {Api} from "../utils/api";
import cors from "cors";
import {checkOrigin} from "../utils/utils";
import express from "express";

function requestInit() {
    Api.setUse(cors({
        origin: (origin: string | undefined, callback) => {
            console.log({ origin });
            if (origin === undefined && process.env.ENV !== undefined) {
                callback({
                    name: "Origin is Undefined",
                    message: "Origin Used is Not Defined",
                    stack: "Origin Used is Not Defined",
                }, origin);
            }
            else if (process.env.ENV === undefined ||
                origin !== undefined && checkOrigin(origin)) {
                callback(null, origin);
            }
            else {
                callback({
                    name: "Origin is Unknown",
                    message: "Origin Used is Not Known",
                    stack: "Origin Used is Not Known",
                }, origin);
            }
        },
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }))
    Api.setUse(express.json());
    Api.setGetRoute("/", (req: any, res: any) => {
        res.send({
            status: process.env.ENV || 'development',
            purpose: 'ECE Student Society',
            owner: 'Purdue ECE'
        });
    });
}


export {requestUser, requestCalendar, requestIO, requestInit};