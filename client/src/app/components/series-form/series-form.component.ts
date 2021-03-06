import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { MessageService } from '../../utils/message.service';
import { DataService, RetrieveType, UpdateType } from '../../api/data.service';
import { Episode } from '../../api/episode';

@Component({
  selector: 'app-series-form',
  templateUrl: './series-form.component.html',
  styleUrls: ['./series-form.component.css']
})
export class SeriesFormComponent implements OnInit {
    series: any;
    season: number;
    episodes: Episode[];
    maxThumbWidth: number;

    constructor(public modalRef: BsModalRef, public messages: MessageService, private api: DataService) {
    }

    ngOnInit() {
        this.loadSeason(this.season || this.series.seasons[0]);
    }

    loadSeason(season) {
        this.season = season;
        this.api.lockScreen();
        var res = [],
            tw = 0,
            th = 99999,
            ep: Episode;
        this.api.retrieve(RetrieveType.episodes, {
            series: this.series.tvdb_id,
            season: this.season,
        }).subscribe(result => {
            result.forEach(function (itm) {
                ep = new Episode(itm);
                res.push(ep);
                tw = Math.max(tw, ep.data.thumbwidth || 400);
                th = Math.min(th, ep.data.thumbheight || 300);
            });
            this.maxThumbWidth = Math.floor((100 * tw) / th);
            this.episodes = res;
            this.api.unlockScreen();
        });
    }

    thumbWidth(ep: Episode) {
        return Math.floor((100 * (ep.data.thumbwidth || 400)) / (ep.data.thumbheight || 225));
    }

    toggleCollected(ep: Episode) {
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: ep.season,
            episode: ep.episode,
            collected: (ep.collected ? 0 : 1)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.localUpdate(ep);
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    toggleWatched(ep: Episode) {
        this.api.lockScreen();
        this.api.update(UpdateType.episode, {
            tvdb_id: this.series.tvdb_id,
            season: ep.season,
            episode: ep.episode,
            watched: (ep.watched ? 0 : 1)
        }).subscribe(result => {
            this.series.load(result[0]);
            this.localUpdate(ep);
            this.api.onUpdate.next(this.series);
            this.api.unlockScreen();
        });
    }

    private localUpdate(ep: Episode) {
        ep.data.collected = ep.episode in (this.series.collected[ep.season] || {});
        ep.data.watched = (this.series.watched[ep.season] || []).indexOf(ep.episode) >= 0;
    }
}
