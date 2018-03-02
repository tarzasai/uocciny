import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Episode extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.episode;
    }

    sortKey():string {
        return super.sortKey() + sprintf('%05d-%05d-%05d', this.data.series, this.data.season, this.data.episode);
    }

    get eid() {
        //return sprintf('S%02dE%02d', this.data.season, this.data.episode);
        return sprintf('%dx%d', this.data.season, this.data.episode);
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

    get date() {
        return this.data.firstAired ? moment(this.data.firstAired) : null;
    }

    get missing() {
        return !(this.watched || this.collected) && this.date && this.date.isBefore(moment(), 'day');
    }
}
