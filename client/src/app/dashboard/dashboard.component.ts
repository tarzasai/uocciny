import { Component, OnInit } from '@angular/core';

import { Title, TitleType } from '../api/title';
import { Movie } from '../api/movie';
import { Series, EpisodePreview } from '../api/series';
import { DataService, RequestType } from '../api/data.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    TitleType = TitleType;
    EpisodePreview = EpisodePreview;

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
            result.sort(function(m1, m2) {
                return m1.released.localeCompare(m2.released);
            });
            result.forEach(function(itm) {
                cmp.titles.push(new Movie(itm));
            });
            this.data.fetch(RequestType.series, {
                available: 1
            }).subscribe(result => {
                result.sort(function(s1, s2) {
                    return s1.name.localeCompare(s2.name);
                });
                result.forEach(function(itm) {
                    cmp.titles.push(new Series(itm));
                });
            })
        });
    }
}
