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

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    MessageType = MessageType;

    VIEWS = {
        watchlist: {
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
            icon: 'fa-pie-chart',
            label: 'Everything',
            movies: null,
            series: null,
            episode: EpisodePreview.any
        },
    };
    CELL_HEIGHT = 186;
    CELL_WIDTH = 480;

    activeView: string;
    titleList = [];
    titleGrid: GridOptions;
    titleCols = [];
    titleRows = [];
    colCount = 0;
    gridMargin = 50;

    constructor(private elref: ElementRef, private config: ConfigService, public messages: MessageService,
        private api: DataService) {
        //
        this.titleGrid = <GridOptions>{
            headerHeight: 0,
            rowHeight: this.CELL_HEIGHT,
            rowSelection: 'single',
            rowDeselection: false,
            enableColResize: false,
            onGridReady: this.onGridReady,
        };

        /*this.titleCols = [
            {
                field: 'col1',
                width: this.CELL_WIDTH,
                cellRendererFramework: TitleParentComponent
            }
        ];*/

        // gli eventi della agGrid di solito hanno l'oggetto GridOptions o la griglia come
        // scopo (this), quindi è praticamente necessario avere questa referenza circolare...
        this.titleGrid.context = this;
    }

    ngOnInit() {
        //this.titleList = this.SAMPLES;
        this.setColumns(this.elref.nativeElement.clientWidth);
        this.openView('available');
        this.api.onUpdate.subscribe(args => {
            //console.log('DashboardComponent.onUpdate', args);
        });
    }

    ngOnDestroy() {
        //
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.setColumns(event.target.innerWidth);
    }

    onGridReady(params) {
        // ???
    }

    setColumns(areaWidth) {
        var tot = Math.max(1, Math.floor((areaWidth - 124) / this.CELL_WIDTH));
        if (tot != this.colCount) {
            this.colCount = tot;
            var cols = [];
            for (var i = 0; i < this.colCount; i++) {
                cols.push({
                    field: 'col' + i,
                    width: this.CELL_WIDTH,
                    cellRendererFramework: TitleParentComponent
                });
            }
            this.titleCols = cols;
            this.setRows();
        }
        this.gridMargin = Math.floor((areaWidth - (this.colCount * this.CELL_WIDTH)) / 2);
    }

    setRows() {
        var rows = [],
            n = -1,
            row;
        while (n < this.titleList.length) {
            row = {};
            for (var j = 0; j < this.colCount; j++) {
                n++;
                row['col' + j] = n < this.titleList.length ? this.titleList[n] : null;
            }
            rows.push(row);
        }
        this.titleRows = rows;
    }

    openView(tag) {
        this.activeView = tag;
        this.config.lockScreen();
        var mp = this.VIEWS[tag].movies,
            sp = this.VIEWS[tag].series,
            ep = this.VIEWS[tag].episode,
            ml = [],
            sl = [];
        this.api.retrieve(RetrieveType.movies, mp).subscribe(result => {
            result.sort(function (m1, m2) {
                return (m1.released || 'Z').localeCompare(m2.released);
            });
            result.forEach(function (itm) {
                ml.push(new Movie(itm));
            });
            this.api.retrieve(RetrieveType.series, sp).subscribe(result => {
                result.sort(function (s1, s2) {
                    return s1.name.localeCompare(s2.name);
                });
                result.forEach(function (itm) {
                    sl.push(new Series(itm, ep));
                });
                this.titleList = sl.concat(ml);
                this.setRows();
                this.config.unlockScreen();
            })
        });
    }
}
