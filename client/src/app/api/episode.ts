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
        return sprintf('%dx%d', this.data.season, this.data.episode);
    }

    get title() {
        return this.data.title || 'N/A';
    }
}
