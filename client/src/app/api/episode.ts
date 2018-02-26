import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Episode extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.episode;
    }

    get eid() {
        //return sprintf('S%02dE%02d', this.data.season, this.data.episode);
        return sprintf('%d%s%d', this.data.season, '&#8226;', this.data.episode);
    }

    get season() {
        return this.data.season;
    }

    get episode() {
        return this.data.episode;
    }

    get title() {
        return this.data.title || 'N/A';
    }
}
