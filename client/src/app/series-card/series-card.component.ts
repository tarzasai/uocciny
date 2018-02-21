import { Component, OnInit, Input } from '@angular/core';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';
import { Series, EpisodePreview } from '../api/series';
import { DataService, UpdateType } from '../api/data.service';

@Component({
    selector: 'app-series-card',
    templateUrl: './series-card.component.html',
    styleUrls: ['./series-card.component.css']
})
export class SeriesCardComponent implements OnInit {
    @Input() series: Series;
    @Input() preview: EpisodePreview;

    EpisodePreview = EpisodePreview;

    constructor(private config: ConfigService, private messages: MessageService, private api: DataService) { }

    ngOnInit() {
    }

    setWatchlist(value) {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            watchlist: (value === true ? 1 : 0)
        }).subscribe(result => {
            this.config.unlockScreen();
            if (result)
                this.series.data.watchlist = value;
        });
    }

    setRating(value) {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: value
        }).subscribe(result => {
            this.config.unlockScreen();
            if (result)
                this.series.data.rating = value;
        });
    }

    trashIt() {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: -1
        }).subscribe(result => {
            this.config.unlockScreen();
            // boh
        });
    }
}
