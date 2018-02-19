import { Title, TitleType } from './title';
import { Episode } from './episode';
import * as moment from 'moment';

export enum EpisodePreview {
    aired,
    missing,
    available
}

export class Series extends Title {
    aired: Episode = null;
    missing: Episode = null;
    available: Episode = null;

    constructor(data: any) {
        super(data);
        this.type = TitleType.series;
        if (this.data.episodes.lastAired && Object.keys(this.data.episodes.lastAired).length)
            this.aired = new Episode(this.data.episodes.lastAired);
        if (this.data.episodes.missing && Object.keys(this.data.episodes.missing).length)
            this.missing = new Episode(this.data.episodes.missing);
        if (this.data.episodes.available && Object.keys(this.data.episodes.available).length)
            this.available = new Episode(this.data.episodes.available);
    }

    get genres() {
        return this.data.genres ? this.data.genres.toLocaleLowerCase() : null;
    }

    get poster() {
        return 'https://www.thetvdb.com/banners/' + this.data.poster; // 680 x 1000
    }

    get summary() {
        return this.data.episodes.summary;
    }
}
