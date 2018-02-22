import { Title, TitleType } from './title';
import { Episode } from './episode';
import * as moment from 'moment';

export enum EpisodePreview {
    aired,
    missing,
    available
}

export class Series extends Title {
    aired: Episode;
    missing: Episode;
    available: Episode;

    constructor(data: any) {
        super(data);
        this.type = TitleType.series;
    }

    load(value: any) {
        super.load(value);
        this.aired = null;
        if (this.data.episodes.lastAired && Object.keys(this.data.episodes.lastAired).length)
            this.aired = new Episode(this.data.episodes.lastAired);
        this.missing = null;
        if (this.data.episodes.missing && Object.keys(this.data.episodes.missing).length)
            this.missing = new Episode(this.data.episodes.missing);
        this.available = null;
        if (this.data.episodes.available && Object.keys(this.data.episodes.available).length)
            this.available = new Episode(this.data.episodes.available);
    }

    preview(type: EpisodePreview): Episode {
        return type === EpisodePreview.aired ? this.aired :
            type === EpisodePreview.missing ? this.missing :
            type === EpisodePreview.available ? this.available :
            null;
    }

    get tvdb_id() {
        return this.data.tvdb_id;
    }

    get genres() {
        return this.data.genres ? this.data.genres.toLocaleLowerCase() : null;
    }

    get poster() {
        return 'https://www.thetvdb.com/banners/' + this.data.poster; // 680 x 1000
    }

    get ended() {
        return this.data.status.sameAs('ended');
    }

    get episodes() {
        return this.data.episodes.summary;
    }
}
