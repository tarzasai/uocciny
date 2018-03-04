import { Component, OnInit, Input } from '@angular/core';

import { MessageService } from '../utils/message.service';
import { DataService, UpdateType } from '../api/data.service';
import { Series, EpisodePreview } from '../api/series';
import { Episode } from '../api/episode';
import { ModalService } from '../utils/modal.service';

@Component({
    selector: 'app-series-card',
    templateUrl: './series-card.component.html',
    styleUrls: ['./series-card.component.css']
})
export class SeriesCardComponent implements OnInit {
    @Input() series: Series;

    episode: Episode;

    EpisodePreview = EpisodePreview;

    constructor(private messages: MessageService, private api: DataService, public modals: ModalService) { }

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
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: -1
        }).subscribe(result => {
            this.series.load(result[0]);
            this.setEpisode();
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    setRating(value) {
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: value
        }).subscribe(result => {
            this.series.load(result[0]);
            this.setEpisode();
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            watchlist: (!this.series.watchlist ? 1 : 0)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.setEpisode();
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleCollected() {
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: this.episode.season,
            episode: this.episode.episode,
            collected: (!this.episode.collected ? 1 : 0)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.setEpisode();
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleWatched() {
        var seen = !this.episode.watched ? 1 : 0,
            coll = seen ? 0 : null
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: this.episode.season,
            episode: this.episode.episode,
            collected: coll,
            watched: seen
        }).subscribe(result => {
            this.series.load(result[0]);
            this.setEpisode();
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
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
