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

    get season() {
        return this.data.season;
    }

    get episode() {
        return this.data.episode;
    }

    get title() {
        return this.data.title || 'N/A';
    }

    get firstAired() {
        return this.data.firstAired ? moment(this.data.firstAired) : null;
    }

    get airsToday() {
        return this.firstAired && this.firstAired.isSame(moment(), 'day');
    }

    get upcoming() {
        return this.firstAired && this.firstAired.isSameOrAfter(moment(), 'day');
    }

    get missing() {
        return !(this.watched || this.collected) && this.firstAired && this.firstAired.isBefore(moment(), 'day');
    }

    airedText(rough) {
        return !this.firstAired ? null : rough ? moment(this.data.firstAired).fromNow() :
            moment(this.data.firstAired).format('DD/MM/YYYY');
    }
}
