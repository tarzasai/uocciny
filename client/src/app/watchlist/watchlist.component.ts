import { Component, OnInit } from '@angular/core';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';
import { Title, TitleType } from '../api/title';
import { Movie } from '../api/movie';
import { Series, EpisodePreview } from '../api/series';
import { DataService, RetrieveType, UpdateType } from '../api/data.service';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
    TitleType = TitleType;
    EpisodePreview = EpisodePreview;

    titles: Title[];

    constructor(private config: ConfigService, private api: DataService) { }

    ngOnInit() {
        this.getData();
        this.api.onUpdate.subscribe(args => {
            //console.log('DashboardComponent.onUpdate', args);
            if (args.output.length <= 0) {
                var i = this.titles.findIndex(function (itm) {
                    return (args.type === UpdateType.movie && itm.type === TitleType.movie && itm.data.imdb_id === args.input.imdb_id) ||
                        (args.type === UpdateType.series && itm.type === TitleType.series && itm.data.tvdb_id === args.input.tvdb_id) ||
                        (itm.type === TitleType.series && itm.data.tvdb_id === args.input.series);
                });
                if (i >= 0)
                    this.titles.splice(i, 1);
                else
                    this.getData();
            } else if (!args.output[0].watchlist) {
                var i = this.titles.findIndex(function (itm) {
                    return (args.type === UpdateType.movie && itm.type === TitleType.movie && itm.data.imdb_id === args.output[0].imdb_id) ||
                        (args.type != UpdateType.movie && itm.type === TitleType.series && itm.data.tvdb_id === args.output[0].tvdb_id);
                });
                if (i >= 0)
                    this.titles.splice(i, 1);
            }
        });
    }

    getData() {
        this.config.lockScreen();
        var ml = [],
            sl = [];
        this.api.retrieve(RetrieveType.movies, {
            watchlist: 1
        }).subscribe(result => {
            result.sort(function (m1, m2) {
                return (m1.released || 'ZZZZ').localeCompare(m2.released);
            });
            result.forEach(function (itm) {
                ml.push(new Movie(itm));
            });
            this.api.retrieve(RetrieveType.series, {
                watchlist: 1
            }).subscribe(result => {
                result.sort(function (s1, s2) {
                    return s1.name.localeCompare(s2.name);
                });
                result.forEach(function (itm) {
                    sl.push(new Series(itm));
                });
                this.titles = sl.concat(ml);
                this.config.unlockScreen();
            })
        });
    }
}
