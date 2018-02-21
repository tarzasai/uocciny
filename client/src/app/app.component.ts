import { Component } from '@angular/core';

import { ConfigService } from './utils/config.service';
import { MessageService, MessageType } from './utils/message.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    MessageType = MessageType;

    constructor(private config: ConfigService, public messages: MessageService) { }
}
