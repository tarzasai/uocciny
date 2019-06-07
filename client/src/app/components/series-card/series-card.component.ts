import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';

import { MessageService } from '../../utils/message.service';
import { DataService, RetrieveType, UpdateType } from '../../api/data.service';
import { Series, EpisodePreview } from '../../api/series';
import { Episode } from '../../api/episode';
import { ModalService } from '../../utils/modal.service';

@Component({
  selector: 'app-series-card',
  templateUrl: './series-card.component.html',
  styleUrls: ['./series-card.component.css']
})
export class SeriesCardComponent implements OnInit {
    // per il template:
    EpisodePreview = EpisodePreview;

    @Input() series: Series;

    episode: Episode;
    updateListener: Subscription;

    constructor(private messages: MessageService, private api: DataService, public modals: ModalService) { }

    ngOnInit() {
        this.updateListener = this.api.onUpdate.subscribe(title => {
            if (title.isSeries && title == this.series)
                this.setEpisode();
        });
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

    forceRefresh() {
        this.api.lockScreen();
        this.api.retrieve(RetrieveType.series, {
            tvdb_id: this.series.tvdb_id,
            refresh: 1
        }).subscribe(result => {
            this.series.load(result[0]);
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    trashSeries() {
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            rating: -1
        }).subscribe(result => {
            this.series.load(result[0]);
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
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: this.series.tvdb_id,
            watchlist: (this.series.watchlist ? 0 : 1)
        }).subscribe(result => {
            this.series.load(result[0]);
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
            collected: (this.episode.collected ? 0 : 1)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleWatched() {
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: this.episode.season,
            episode: this.episode.episode,
            watched: (this.episode.watched ? 0 : 1)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    openLink(url) {
        window.open(url, '_blank');
    }

    get more() {
        if (this.episode == this.series.available && this.series.episodes.available > 1)
            return this.series.episodes.available - 1;
        if (this.episode == this.series.missing && this.series.episodes.missing > 1)
            return this.series.episodes.missing - 1;
        return null;
    }
}
