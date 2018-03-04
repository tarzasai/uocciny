import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { GridOptions } from 'ag-grid/main';

import { MessageService } from '../utils/message.service';
import { DataService, RetrieveType } from '../api/data.service';
import { Episode } from '../api/episode';
import { TitleParentComponent } from '../title-parent/title-parent.component';

@Component({
    selector: 'app-series-form',
    templateUrl: './series-form.component.html',
    styleUrls: ['./series-form.component.css']
})
export class SeriesFormComponent implements OnInit {
    series: any;
    season = null;

    epGrid: GridOptions;
    epCols = [];
    epRows = [];

    constructor(public modalRef: BsModalRef, public messages: MessageService, private api: DataService) {
        this.epGrid = <GridOptions>{
            headerHeight: 0,
            rowHeight: 190,
            enableColResize: false,
            onGridReady: this.onGridReady,
        };
        this.epCols = [
            {
                field: 'episode',
                width: 740,
                cellRendererFramework: TitleParentComponent
            }
        ];
        // gli eventi della agGrid di solito hanno l'oggetto GridOptions o la griglia come
        // scopo (this), quindi è praticamente necessario avere questa referenza circolare...
        this.epGrid.context = this;
    }

    ngOnInit() {
        //
        this.loadSeason(this.series.seasons[0]);
    }

    onGridReady(params) {
    }

    loadSeason(season) {
        this.season = season;
        this.api.lockScreen();
        var res = [];
        this.api.retrieve(RetrieveType.episodes, {
            series: this.series.tvdb_id,
            season: this.season,
        }).subscribe(result => {
            result.forEach(function (itm) {
                res.push({ episode: new Episode(itm) });
            });
            this.epRows = res;
            this.api.unlockScreen();
        });
    }
}
