import { Component, OnInit } from '@angular/core';

import { Title, Movie, Series, TitleType } from '../api/title';
import { DataService, RequestType } from '../api/data.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    TitleType = TitleType;

    titles: Title[];

    constructor(private data: DataService) { }

    ngOnInit() {
        this.getData();
    }

    getData() {
        var cmp = this;
        this.titles = [];
        this.data.fetch(RequestType.movies, {
            collected: 1,
            watched: 0
        }).subscribe(result => {
            console.log(result);
            result.forEach(function(itm) {
                cmp.titles.push(new Movie(itm));
            });
            this.data.fetch(RequestType.series, {
                available: 1
            }).subscribe(result => {
                result.forEach(function(itm) {
                    cmp.titles.push(new Series(itm));
                });
            })
        });
    }
}
