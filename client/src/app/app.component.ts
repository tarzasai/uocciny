import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { GridOptions } from 'ag-grid/main';

import { ConfigService } from './utils/config.service';
import { MessageService, MessageType } from './utils/message.service';
import { TitleParentComponent } from './title-parent/title-parent.component';
import { TitleCellComponent } from './title-cell/title-cell.component';
import { Title, TitleType } from './api/title';
import { Movie } from './api/movie';
import { Series, EpisodePreview } from './api/series';
import { DataService, RetrieveType, UpdateType } from './api/data.service';
import { Subscription } from 'rxjs/Subscription';

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
        icon: 'fa-hdd-o',
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

    activeView = null;
    updateListener: Subscription;
    titleList = [];
    titleGrid: GridOptions;
    titleCols = [];
    titleRows = [];
    titleFltr = null;
    colCount = 0;
    gridMargin = 50;

    // https://valor-software.com/ngx-bootstrap/#/modals


    constructor(private elref: ElementRef, private config: ConfigService, public messages: MessageService,
        private api: DataService) {
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
        this.setColumns(this.elref.nativeElement.clientWidth);
        this.getData(VIEW_TYPES[localStorage.getItem('LastView') || 'available']);
        this.updateListener = this.api.onUpdate.subscribe(args => {
            //console.log('DashboardComponent.onUpdate', args);
            var idx = -1;
            if (args.output.length <= 0) {
                idx = this.titleList.findIndex(function (itm) {
                    return (args.type === UpdateType.movie && itm.type === TitleType.movie && itm.data.imdb_id === args.input.imdb_id) ||
                        (args.type === UpdateType.series && itm.type === TitleType.series && itm.data.tvdb_id === args.input.tvdb_id) ||
                        (itm.type === TitleType.series && itm.data.tvdb_id === args.input.series);
                });
                if (idx < 0)
                    this.getData();
                else {
                    this.titleList.splice(idx, 1);
                    this.setRows();
                }
            } else {
                var res = args.output[0];
                idx = this.titleList.findIndex(function (itm) {
                    return (args.type === UpdateType.movie && itm.type === TitleType.movie && itm.data.imdb_id === res.imdb_id) ||
                        (args.type != UpdateType.movie && itm.type === TitleType.series && itm.data.tvdb_id === res.tvdb_id);
                });
                if (idx < 0) {
                    this.getData();
                } else {
                    var obj = this.titleList[idx];
                    obj.load(res);
                    if ((this.activeView === VIEW_TYPES.watchlist && !obj.watchlist) ||
                        (this.activeView === VIEW_TYPES.missing && !obj.missing) ||
                        (this.activeView === VIEW_TYPES.available && !obj.available))
                        this.titleList.splice(idx, 1);
                    this.setRows();
                }
            }
        });
    }

    ngOnDestroy() {
        this.updateListener.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.setColumns(event.target.innerWidth);
    }

    onGridReady(params) {
        // ???
    }

    getData(view = null) {
        if (view) {
            this.activeView = view;
            localStorage.setItem('LastView', view.tag);
        }
        this.config.lockScreen();
        var ml = [],
            sl = [];
        this.api.retrieve(RetrieveType.movies, view.movies).subscribe(result => {
            result.sort(function (m1, m2) {
                var y1 = (m1.released || 'ZZZZ').substr(0, 4),
                    y2 = (m2.released || 'ZZZZ').substr(0, 4),
                    n1 = (m1.name || 'ZZZZ').toLocaleLowerCase(),
                    n2 = (m2.name || 'ZZZZ').toLocaleLowerCase();
                return y1.localeCompare(y2) || n1.localeCompare(n2);
            });
            result.forEach(function (itm) {
                ml.push(new Movie(itm));
            });
            this.api.retrieve(RetrieveType.series, view.series).subscribe(result => {
                result.sort(function (s1, s2) {
                    var n1 = (s1.name || 'ZZZZ').toLocaleLowerCase(),
                        n2 = (s2.name || 'ZZZZ').toLocaleLowerCase();
                    return n1.localeCompare(n2);
                });
                result.forEach(function (itm) {
                    sl.push(new Series(itm, view.episode));
                });
                this.setRows(sl.concat(ml));
                this.config.unlockScreen();
            })
        });
    }

    setColumns(areaWidth) {
        var tot = Math.max(1, Math.floor((areaWidth - 124) / CELL_WIDTH));
        if (tot != this.colCount) {
            this.colCount = tot;
            var cols = [];
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
        this.gridMargin = Math.floor((areaWidth - (this.colCount * CELL_WIDTH)) / 2);
    }

    setRows(values = null) {
        if (values)
            this.titleList = values;
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
}
