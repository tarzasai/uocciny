import { Component, OnInit, Input } from '@angular/core';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';
import { Series, EpisodePreview } from '../api/series';
import { DataService, UpdateType } from '../api/data.service';
import { Episode } from '../api/episode';

@Component({
    selector: 'app-series-card',
    templateUrl: './series-card.component.html',
    styleUrls: ['./series-card.component.css']
})
export class SeriesCardComponent implements OnInit {
    @Input() series: Series;
    @Input() preview: EpisodePreview;

    episode: Episode;

    EpisodePreview = EpisodePreview;

    constructor(private config: ConfigService, private messages: MessageService, private api: DataService) { }

    ngOnInit() {
        this.episode = this.series.preview(this.preview);
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
        this.config.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: this.episode.season,
            episode: this.episode.episode,
            collected: (!this.episode.collected ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleWatched() {
        this.config.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: this.episode.season,
            episode: this.episode.episode,
            watched: (!this.episode.watched ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.series.load(result[0]);
            this.config.unlockScreen();
        });
    }

    openLink(url) {
        window.open(url, '_blank');
    }

    get episodeIcon() {
        if (this.episode.watched)
            return 'fa-eye';
        if (this.episode.collected)
            return 'fa-hdd-o';
        if (this.episode.missing)
            return 'fa-eye-slash';
        if (!this.episode.firstAired || this.episode.upcoming)
            return this.episode.airsToday ? 'fa-clock' : 'fa-calendar';
        return 'fa-rss';
    }
}
