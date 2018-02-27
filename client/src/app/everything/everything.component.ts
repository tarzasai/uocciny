import { Component, OnInit } from '@angular/core';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';
import { Title, TitleType } from '../api/title';
import { Movie } from '../api/movie';
import { Series, EpisodePreview } from '../api/series';
import { DataService, RetrieveType, UpdateType } from '../api/data.service';

@Component({
    selector: 'app-everything',
    templateUrl: './everything.component.html',
    styleUrls: ['./everything.component.css']
})
export class EverythingComponent implements OnInit {
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
            }
        });
    }

    getData() {
        this.config.lockScreen();
        var ml = [],
            sl = [];
        this.api.retrieve(RetrieveType.movies, null).subscribe(result => {
            result.sort(function (m1, m2) {
                return (m1.released || 'ZZZZ').localeCompare(m2.released);
            });
            result.forEach(function (itm) {
                ml.push(new Movie(itm));
            });
            this.api.retrieve(RetrieveType.series, null).subscribe(result => {
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

    itemHeight = 186;
    itemWidth = 480;
    firstVisible = -1;
    lastVisible = -1;

    onScroll(e) {
        var pageHeight = e.target.clientHeight - 20,
            pageWidth = e.target.clientWidth - 20,
            topRow = Math.floor(e.target.scrollTop / this.itemHeight),
            rowItems = Math.floor(pageWidth / this.itemWidth),
            pageRows = Math.floor(pageHeight / this.itemHeight),
            pageItems = pageRows * rowItems;
        this.firstVisible = Math.max(topRow, 0) - pageItems;
        this.lastVisible = this.firstVisible + pageItems + pageItems;

        console.log(
            //'clientHeight:', e.target.clientHeight,
            //'clientWidth:', e.target.clientWidth,
            'scrollTop:', e.target.scrollTop,
            //'rowItems:', rowItems,
            //'pageRows:', pageRows,
            //'pageItems:', pageItems,
            'topRow:', topRow,
            'firstVisible:', this.firstVisible,
            'lastVisible:', this.lastVisible
        );

    }

    isVisible(idx) {
        return (this.firstVisible < 0 && idx < 50) || (this.firstVisible >= 0 && idx >= this.firstVisible && idx <= this.lastVisible);
    }
}
