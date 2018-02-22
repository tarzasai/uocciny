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

    trashSeries() {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: -1
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    setRating(value) {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: value
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            watchlist: (!this.series.watchlist ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleCollected() {
        var ep = this.series.preview(this.preview);
        this.config.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: ep.season,
            episode: ep.episode,
            collected: (!ep.collected ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleWatched() {
        var ep = this.series.preview(this.preview);
        this.config.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: ep.season,
            episode: ep.episode,
            watched: (!ep.watched ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }
}
