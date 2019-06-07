import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GridOptions, ColumnApi } from 'ag-grid-community';
import { Subscription } from 'rxjs';

import { ModalService } from './utils/modal.service';
import { MessageService, MessageType } from './utils/message.service';
import { TitleParentComponent } from './components/title-parent/title-parent.component';
import { Movie } from './api/movie';
import { Series, EpisodePreview } from './api/series';
import { DataService, RetrieveType, UpdateType } from './api/data.service';

const CELL_HEIGHT = 186;
const CELL_WIDTH = 480;
const VIEW_TYPES = {
    watchlist: {
        tag: 'watchlist',
        icon: 'fa-heart',
        label: 'Watchlist',
        movies: {
            watchlist: 1
        },
        series: {
            watchlist: 1
        },
        episode: EpisodePreview.upcoming,
        watchlist: true
    },
    available: {
        tag: 'available',
        icon: 'fa-play-circle',
        label: 'Available',
        movies: {
            collected: 1,
            watched: 0
        },
        series: {
            available: 1
        },
        episode: EpisodePreview.available,
        available: true
    },
    missing: {
        tag: 'missing',
        icon: 'fa-eye-slash',
        label: 'Missing',
        movies: {
            missing: 1
        },
        series: {
            missing: 1
        },
        episode: EpisodePreview.missing,
        missing: true
    },
    collected: {
        tag: 'collected',
        icon: 'fa-hdd-o',
        label: 'Collected',
        movies: {
            collected: 1
        },
        series: {
            collected: 1
        },
        episode: EpisodePreview.any,
        collected: true
    },
    everything: {
        tag: 'everything',
        icon: 'fa-pie-chart',
        label: 'Everything',
        movies: null,
        series: null,
        episode: EpisodePreview.any,
        everything: true
    },
};

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    // servono al template:
    MessageType = MessageType;
    ViewTypes = VIEW_TYPES;

    updateListener: Subscription;
    activeView = null;
    titleList = [];
    titleCols = [];
    titleRows = [];
    titleFltr = null;
    colCount = 0;

    columnApi: ColumnApi = null;

    titleGrid: GridOptions;

    constructor(public modals: ModalService, public messages: MessageService, public api: DataService) { }

    ngOnInit() {

        console.warn('ngOnInit');

        var ctx = this;
        ctx.titleGrid = <GridOptions>{
            headerHeight: 0,
            rowHeight: CELL_HEIGHT,
            enableColResize: false,
            onGridReady: (params) => {

                console.warn('onGridReady', ctx, params);

                ctx.titleGrid.context = ctx;
                ctx.columnApi = params.columnApi;
                ctx.setColumns();
                ctx.getData(VIEW_TYPES[localStorage.getItem('LastView') || 'available']);

                ctx.updateListener = ctx.api.onUpdate.subscribe(title => {
                    if (
                        title.data.banned ||
                        (ctx.activeView.watchlist && !title.watchlist) ||
                        (ctx.activeView.available && !title.available) ||
                        (ctx.activeView.missing && !title.missing) ||
                        (ctx.activeView.collected && !title.collected) ||
                        (title.isMovie && !(title.watched || title.collected || title.watchlist))
                    ) {
                        ctx.removeTitle(title);
                    } else {
                        var inlist = false,
                            chk;
                        for (var i = 0; i < ctx.titleList.length; i++) {
                            chk = ctx.titleList[i];
                            if (chk.type === title.type && (
                                (chk.isMovie && chk.imdb_id === title.imdb_id) ||
                                (chk.isSeries && chk.data.tvdb_id === title.data.tvdb_id)
                            )) {
                                inlist = true;
                                break;
                            }
                        }
                        if (!inlist && !title.isEpisode && !title.data.banned && (
                            ctx.activeView.everything ||
                            (ctx.activeView.watchlist && title.watchlist) ||
                            (ctx.activeView.available && title.available) ||
                            (ctx.activeView.missing && title.missing) ||
                            (ctx.activeView.collected && title.collected)
                        )) {
                            var newlist = ctx.titleList.splice(0);
                            newlist.push(title);
                            ctx.setRows(newlist);
                        }
                    }
                });
            }
        };
    }

    ngOnDestroy() {
        this.updateListener.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.setColumns();
    }

    getData(view = null) {

        console.warn('getData', view);

        var ctx = this,
            res = [];
        if (view) {
            ctx.activeView = view;
            localStorage.setItem('LastView', view.tag);
        } else
            view = ctx.activeView;
        ctx.api.lockScreen();
        ctx.api.retrieve(RetrieveType.series, view.series).subscribe(result => {
            result.forEach(function (itm) {
                res.push(new Series(itm, view.episode));
            });
            ctx.api.retrieve(RetrieveType.movies, view.movies).subscribe(result => {
                result.forEach(function (itm) {
                    res.push(new Movie(itm));
                });
                ctx.setRows(res);
                ctx.setOffset();
                ctx.api.unlockScreen();
            })
        });
    }

    setOffset() {

        console.warn('setOffset', this);

        var w = window.innerWidth,
            o = Math.floor((w - (this.colCount * CELL_WIDTH)) / 2);
        //console.log('setOffset()', w, o);
        this.columnApi.setColumnWidth('hdr', o, false);
    }

    setColumns() {
        var tot = Math.max(1, Math.floor((window.innerWidth - 124) / CELL_WIDTH));
        if (tot != this.colCount) {
            this.colCount = tot;
            var cols = [];
            cols.push({
                field: 'hdr',
                width: 0
            });
            for (var i = 0; i < this.colCount; i++) {
                cols.push({
                    field: 'col' + i,
                    width: CELL_WIDTH,
                    cellRendererFramework: TitleParentComponent
                });
            }
            this.titleCols = cols;
            this.setRows(); // bisogna rifare la distribuzione
        }
        this.setOffset();
    }

    setRows(values = null) {
        if (values) {
            this.titleList = values;
            this.titleList.sort(function (t1, t2) {
                return t1.sortKey().localeCompare(t2.sortKey());
            });
        }
        var rows = [],
            n = 0,
            row, j;
        while (n < this.titleList.length) {
            row = {};
            j = 0;
            while (j < this.colCount && n < this.titleList.length) {
                if (!this.titleFltr || this.titleList[n].hasText(this.titleFltr)) {
                    row['col' + j] = this.titleList[n];
                    j++;
                }
                n++;
            }
            if (j > 0)
                rows.push(row);
        }
        this.titleRows = rows;
    }

    removeTitle(title) {
        var start = this.titleList.indexOf(title);
        this.titleList.splice(start, 1);
        var ctx = this,
            n = -1,
            col;
        this.titleGrid.api.forEachNode(function (node) {
            for (var c = 0; c < ctx.colCount; c++) {
                col = 'col' + c;
                n++;
                if (n >= start)
                    node.setDataValue(col, n < ctx.titleList.length ? ctx.titleList[n] : null);
            }
        });
    }

    importIMDB() {
        this.api.lockScreen();
        this.api.import().subscribe(result => {
            var res = [];
            result.forEach(function (itm) {
                res.push(new Movie(itm));
            });
            if (res.length > 0)
                this.setRows(this.titleList.concat(res));
            this.api.unlockScreen();
        });
    }

    cleanupDB() {
        this.api.lockScreen();
        this.api.cleanup().subscribe(result => {
            this.api.unlockScreen();
            if (result > 0)
                this.getData();
        });
    }
}
