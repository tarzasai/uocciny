import { Title, TitleType } from './title';
import { Episode } from './episode';
import * as moment from 'moment';

export enum EpisodePreview {
    any,
    aired,
    missing,
    upcoming,
    available
}

export class Series extends Title {
    aired: Episode;
    missing: Episode;
    upcoming: Episode;
    available: Episode;
    //
    preview: EpisodePreview;

    constructor(data: any, preview: EpisodePreview = EpisodePreview.any) {
        super(data);
        this.type = TitleType.series;
        this.preview = preview;
    }

    load(value: any) {
        super.load(value);
        this.aired = null;
        if (this.data.episodes.lastAired && Object.keys(this.data.episodes.lastAired).length)
            this.aired = new Episode(this.data.episodes.lastAired);
        this.missing = null;
        if (this.data.episodes.missing && Object.keys(this.data.episodes.missing).length)
            this.missing = new Episode(this.data.episodes.missing);
        this.upcoming = null;
        if (this.data.episodes.upcoming && Object.keys(this.data.episodes.upcoming).length)
            this.upcoming = new Episode(this.data.episodes.upcoming);
        this.available = null;
        if (this.data.episodes.available && Object.keys(this.data.episodes.available).length)
            this.available = new Episode(this.data.episodes.available);
    }

    sortKey():string {
        return super.sortKey() + (this.data.name || 'zzzzzzzzzz').toLocaleLowerCase();
    }

    get tvdb_id() {
        return this.data.tvdb_id;
    }

    get genres() {
        return this.data.genres ? this.data.genres.toLocaleLowerCase() : null;
    }

    get poster() {
        return this.data.poster ? 'https://www.thetvdb.com/banners/' + this.data.poster : null;
        // 680 x 1000
    }

    get ended() {
        return this.data.status.sameAs('ended');
    }

    get network() {
        return this.ended ? 'Ended' : this.data.network;
    }

    get episodes() {
        return this.data.episodes.summary;
    }
}
