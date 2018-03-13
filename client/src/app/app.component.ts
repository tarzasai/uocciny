import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GridOptions } from 'ag-grid/main';
import { Subscription } from 'rxjs/Subscription';

import { ModalService } from './utils/modal.service';
import { MessageService, MessageType } from './utils/message.service';
import { TitleParentComponent } from './title-parent/title-parent.component';
import { TitleCellComponent } from './title-cell/title-cell.component';
import { Title, TitleType } from './api/title';
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
        episode: EpisodePreview.upcoming
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
        episode: EpisodePreview.available
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
        episode: EpisodePreview.missing
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
        episode: EpisodePreview.any
    },
    everything: {
        tag: 'everything',
        icon: 'fa-pie-chart',
        label: 'Everything',
        movies: null,
        series: null,
        episode: EpisodePreview.any
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
    titleGrid: GridOptions;
    titleCols = [];
    titleRows = [];
    titleFltr = null;
    colCount = 0;

    constructor(private modals: ModalService, public messages: MessageService, private api: DataService) {
        //
        this.titleGrid = <GridOptions>{
            headerHeight: 0,
            rowHeight: CELL_HEIGHT,
            enableColResize: false,
            onGridReady: this.onGridReady,
        };
        // gli eventi della agGrid di solito hanno l'oggetto GridOptions o la griglia come
        // scopo (this), quindi è praticamente necessario avere questa referenza circolare...
        this.titleGrid.context = this;
    }

    ngOnInit() {
        this.updateListener = this.api.onUpdate.subscribe(title => {
            //console.log('onUpdate', title);
            if (
                title.data.banned ||
                (this.activeView === VIEW_TYPES.watchlist && !title.watchlist) ||
                (this.activeView === VIEW_TYPES.available && !title.available) ||
                (this.activeView === VIEW_TYPES.missing && !title.missing) ||
                (this.activeView === VIEW_TYPES.collected && !title.collected) ||
                (title.isMovie && !(title.watched || title.collected || title.watchlist))
            )
                this.removeTitle(title);
        });
    }

    ngOnDestroy() {
        this.updateListener.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.setColumns();
    }

    onGridReady(params) {
        var grd: any = this,
            ctx: any = grd.context;
        ctx.setColumns();
        ctx.getData(VIEW_TYPES[localStorage.getItem('LastView') || 'available']);
    }

    getData(view = null) {
        if (view) {
            this.activeView = view;
            localStorage.setItem('LastView', view.tag);
        } else
            view = this.activeView;
        this.api.lockScreen();
        var res = [];
        this.api.retrieve(RetrieveType.series, view.series).subscribe(result => {
            result.forEach(function (itm) {
                res.push(new Series(itm, view.episode));
            });
            this.api.retrieve(RetrieveType.movies, view.movies).subscribe(result => {
                result.forEach(function (itm) {
                    res.push(new Movie(itm));
                });
                this.setRows(res);
                this.setOffset();
                this.api.unlockScreen();
            })
        });
    }

    setOffset() {
        var w = window.innerWidth,
            o = Math.floor((w - (this.colCount * CELL_WIDTH)) / 2);
        //console.log('setOffset()', w, o);
        this.titleGrid.columnApi.setColumnWidth('hdr', o, false);
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
        this.titleGrid.api.forEachNode(function(node) {
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
