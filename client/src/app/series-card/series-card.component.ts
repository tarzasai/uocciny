import { Component, OnInit, Input } from '@angular/core';
import { Series, EpisodePreview } from '../api/series';

@Component({
    selector: 'app-series-card',
    templateUrl: './series-card.component.html',
    styleUrls: ['./series-card.component.css']
})
export class SeriesCardComponent implements OnInit {
    @Input() series: Series;
    @Input() preview: EpisodePreview;

    EpisodePreview = EpisodePreview;

    constructor() { }

    ngOnInit() {
    }
}
