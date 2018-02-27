import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { GridOptions } from 'ag-grid/main';

import { ConfigService } from './utils/config.service';
import { MessageService, MessageType } from './utils/message.service';
import { TitleParentComponent } from './title-parent/title-parent.component';
import { TitleCellComponent } from './title-cell/title-cell.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    MessageType = MessageType;

    VIEWS = [
        {
            tag: 'watchlist',
            lbl: 'Watchlist',
            ico: 'fa-heart',
        },
        {
            tag: 'available',
            lbl: 'Available',
            ico: 'fa-hdd-o',
            url: '/dashboard'
        },
        {
            tag: 'missing',
            lbl: 'Missing',
            ico: 'fa-eye-slash',
        },
        {
            tag: 'everything',
            lbl: 'Everything',
            ico: 'fa-pie-chart',
        },
    ];
    CELL_HEIGHT = 186;
    CELL_WIDTH = 480;

    SAMPLES = [
        {
            name: 'uno',
            data: 'uno-data'
        },
        {
            name: 'due',
            data: 'due-data'
        },
        {
            name: 'tre',
            data: 'tre-data'
        },
        {
            name: 'quattro',
            data: 'quattro-data'
        },
        {
            name: 'cinque',
            data: 'cinque-data'
        },
    ];

    activeView: string;
    titleList = [];
    titleGrid: GridOptions;
    titleCols = [];
    titleRows = [];
    colCount = 0;

    constructor(private config: ConfigService, public messages: MessageService, private elref: ElementRef) {
        //
        this.titleGrid = <GridOptions>{
            rowSelection: 'single',
            rowDeselection: false,
            enableColResize: false,
            onGridReady: this.onGridReady,
        };

        /*this.titleCols = [
            {
                field: 'name',
                width: 80
            },
            {
                field: 'data',
                width: 80
            },
        ];*/

        // gli eventi della agGrid di solito hanno l'oggetto GridOptions o la griglia come
        // scopo (this), quindi è praticamente necessario avere questa referenza circolare...
        this.titleGrid.context = this;
    }


    //https://www.ag-grid.com/javascript-grid-cell-rendering-components/#angular-cell-render-components


    ngOnInit() {

        this.titleList = this.SAMPLES;

        this.setColumns(Math.floor((this.elref.nativeElement.clientWidth - 10) / this.CELL_WIDTH));
        this.openView('available');
    }

    ngOnDestroy() {
        //
    }

    setColumns(tot) {
        if (tot === this.colCount)
            return;
        var cols = [],
            rows = [];
        for (var i = 0; i < this.colCount; i++) {
            cols.push({
                field: 'col' + i,
                width: this.CELL_WIDTH,
                cellRendererFramework: TitleParentComponent
            });
        }
        var n = -1,
            row;
        while (n < this.titleList.length) {
            row = {};
            for (var j = 0; j < this.colCount; j++) {
                n++;
                row['col' + j] = n < this.titleList.length ? this.titleList[n] : null;
            }
            rows.push(row);
        }
        this.titleCols = cols;
        this.titleRows = rows;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        //this.setColumns(Math.floor((event.target.innerWidth - 10) / this.CELL_WIDTH));
    }

    onGridReady(params) {
        //
    }

    openView(tag) {
        this.activeView = tag;
    }
}
