import { Component, OnInit, Input } from '@angular/core';

import { MessageService } from '../utils/message.service';
import { DataService, UpdateType } from '../api/data.service';
import { Episode } from '../api/episode';

@Component({
    selector: 'app-episode-card',
    templateUrl: './episode-card.component.html',
    styleUrls: ['./episode-card.component.css']
})
export class EpisodeCardComponent implements OnInit {
    @Input() episode: Episode;

    static cardHeight = 102 + 10;

    thumbHeight:number;
    thumbWidth:number;

    constructor(private messages: MessageService, private api: DataService) { }

    ngOnInit() {
        var th = this.episode.data.thumbHeight || 225,
            tw = this.episode.data.thumbWidth || 400;
        this.thumbHeight = 102;//Math.floor(th / 2);
        this.thumbWidth = Math.floor((this.thumbHeight * tw) / th);
    }

    toggleCollected() {
        /*this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.episode.series,
            season: this.episode.season,
            episode: this.episode.episode,
            collected: (!this.episode.collected ? 1 : 0)
        }).subscribe(result => {
            this.episode.load(result[0]);
            this.api.onUpdate.next(this.episode);
            this.api.unlockScreen();
        });*/
    }

    toggleWatched() {
        /*var seen = !this.episode.watched ? 1 : 0,
            coll = seen ? 0 : null
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.episode.series,
            season: this.episode.season,
            episode: this.episode.episode,
            collected: coll,
            watched: seen
        }).subscribe(result => {
            this.episode.load(result[0]);
            this.api.onUpdate.next(this.episode);
            this.api.unlockScreen();
        });*/
    }
}
