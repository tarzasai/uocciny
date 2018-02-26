import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, UrlSegment, NavigationEnd } from '@angular/router';

import { ConfigService } from './utils/config.service';
import { MessageService, MessageType } from './utils/message.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    MessageType = MessageType;

    LINKS = [
        {
            lbl: 'Watchlist',
            btn: 'fa-heart',
            url: '/watchlist'
        },
        {
            lbl: 'Missing',
            btn: 'fa-eye-slash',
            url: '/missings'
        },
        {
            lbl: 'Available',
            btn: 'fa-hdd-o',
            url: '/dashboard'
        },
        {
            lbl: 'Everything',
            btn: 'fa-pie-chart',
            url: '/everything'
        },
    ];

    unsubs: Subscription[] = [];
    activeUrl: string;

    constructor(private config: ConfigService, public messages: MessageService, private router: Router) { }

    ngOnInit() {
        let cmp = this;
        this.unsubs.push(this.router.events.subscribe(function (e) {
            if (e instanceof NavigationEnd)
                cmp.activeUrl = e.urlAfterRedirects;
        }));
    }

    ngOnDestroy() {
        this.unsubs.forEach(function(u) {
            u.unsubscribe()
        });
    }
}
