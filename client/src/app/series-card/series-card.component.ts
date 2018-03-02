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

    episode: Episode;

    EpisodePreview = EpisodePreview;

    constructor(private config: ConfigService, private messages: MessageService, private api: DataService) { }

    ngOnInit() {
        this.setEpisode();
    }

    setEpisode() {
        var ser = this.series;
        this.episode = (
            ser.preview === EpisodePreview.available ? (ser.available || ser.aired) :
            ser.preview === EpisodePreview.upcoming ? (ser.upcoming || ser.aired) :
            ser.preview === EpisodePreview.missing ? (ser.missing || ser.aired) :
            ser.preview === EpisodePreview.any ? (ser.missing || ser.available || ser.upcoming || ser.aired) :
            ser.aired
        );
    }

    trashSeries() {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: -1
        }).subscribe(result => {
            this.config.unlockScreen();
        });
    }

    setRating(value) {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: value
        }).subscribe(result => {
            if (result.length > 0) {
                this.series.load(result[0]);
                this.setEpisode();
            }
            this.config.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.config.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            watchlist: (!this.series.watchlist ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0) {
                this.series.load(result[0]);
                this.setEpisode();
            }
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
            if (result.length > 0) {
                this.series.load(result[0]);
                this.setEpisode();
            }
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
            if (result.length > 0) {
                this.series.load(result[0]);
                this.setEpisode();
            }
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
        if (!this.episode.date || this.episode.isToday || this.episode.isAfter)
            return this.episode.isToday ? 'fa-clock' : 'fa-calendar';
        return 'fa-rss';
    }
}
