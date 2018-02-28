import { Component, OnInit, Input } from '@angular/core';

import { TitleType } from '../api/title';
import { EpisodePreview } from '../api/series';

@Component({
    selector: 'title-cell',
    templateUrl: './title-cell.component.html',
    styleUrls: ['./title-cell.component.css']
})
export class TitleCellComponent implements OnInit {
    TitleType = TitleType;
    EpisodePreview = EpisodePreview;

    @Input() title: any = null;

    constructor() { }

    ngOnInit() {
    }
}
