import { Component, OnInit, Input } from '@angular/core';

import { MessageService } from '../utils/message.service';
import { DataService, RetrieveType, UpdateType } from '../api/data.service';
import { Movie } from '../api/movie';

@Component({
    selector: 'app-movie-card',
    templateUrl: './movie-card.component.html',
    styleUrls: ['./movie-card.component.css']
})
export class MovieCardComponent implements OnInit {
    @Input() movie: Movie;

    constructor(private messages: MessageService, private api: DataService) { }

    ngOnInit() { }

    trashMovie() {
        this.api.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            rating: -1
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    forceRefresh() {
        this.api.lockScreen();
        this.api.retrieve(RetrieveType.movies, {
            imdb_id: this.movie.imdb_id,
            refresh: 1
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    setRating(value) {
        this.api.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            rating: value
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.api.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            watchlist: (!this.movie.watchlist ? 1 : 0)
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    toggleCollected() {
        this.api.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            collected: (!this.movie.collected ? 1 : 0)
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    toggleWatched() {
        this.api.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            watched: (!this.movie.watched ? 1 : 0)
        }).subscribe(result => {
            this.movie.load(result[0]);
            this.api.onUpdate.next(this.movie);
            this.api.unlockScreen();
        });
    }

    openLink(url) {
        window.open(url, '_blank');
    }

    get posterWidth() {
        return Math.floor((156 * (this.movie.data.posterWidth || 780)) / (this.movie.data.posterHeight || 1170));
    }
}
