import { Injectable } from '@angular/core';
import * as moment from 'moment';

export enum MessageType {
    info = 0,
    warning = 1,
    error = 3
}

export class Message {
    type: MessageType;
    title: string;
    text: string;
    time = moment();

    same(msg: Message) {
        return msg.type === this.type && msg.text === this.text && msg.title === this.title;
    }
}

@Injectable()
export class MessageService {
    list: Message[] = [];

    constructor() {
        var srv = this;
        setInterval(function() {
            let i = 0,
                now = moment();
            while (srv.list.length > 0 && i < srv.list.length) {
                if (now.diff(srv.list[i].time) >= 20000)
                    srv.list.splice(i, 1);
                else
                    i++;
            }
        }, 5000);
    }

    private add(type: MessageType, title: string, text: string) {
        let msg = new Message();
        msg.type = type;
        msg.title = title;
        msg.text = text;
        for (var i = 0; i < this.list.length; i++)
            if (msg.same(this.list[i])) {
                this.list.splice(i, 1)[0];
                break;
            }
        this.list.push(msg);
    }

    addInfo(text: string, title: string = null) {
        this.add(MessageType.info, title, text);
    }

    addWarning(text: string, title: string = null) {
        this.add(MessageType.warning, title, text);
    }

    addError(text: string, title: string = null) {
        this.add(MessageType.error, title, text);
    }

    del(i: number) {
        if (i >= 0 && i < this.list.length)
            this.list.splice(i, 1);
    }
}
