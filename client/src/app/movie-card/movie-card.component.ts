import { Component, OnInit, Input } from '@angular/core';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';
import { Movie } from '../api/movie';
import { DataService, UpdateType } from '../api/data.service';

@Component({
    selector: 'app-movie-card',
    templateUrl: './movie-card.component.html',
    styleUrls: ['./movie-card.component.css']
})
export class MovieCardComponent implements OnInit {
    @Input() movie: Movie;

    constructor(private config: ConfigService, private messages: MessageService, private api: DataService) { }

    ngOnInit() {
    }

    setRating(value) {
        this.config.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            rating: value
        }).subscribe(result => {
            if (result.length > 0)
                this.movie.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleWatchlist() {
        this.config.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            watchlist: (!this.movie.watchlist ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.movie.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleCollected() {
        this.config.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            collected: (!this.movie.collected ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.movie.load(result[0]);
            this.config.unlockScreen();
        });
    }

    toggleWatched() {
        this.config.lockScreen();
        this.api.update(UpdateType.movie, {
            imdb_id: this.movie.imdb_id,
            watched: (!this.movie.watched ? 1 : 0)
        }).subscribe(result => {
            if (result.length > 0)
                this.movie.load(result[0]);
            this.config.unlockScreen();
        });
    }

    openLink(url) {
        window.open(url, '_blank');
    }
}
