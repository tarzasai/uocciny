import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Movie extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.movie;
    }

    get poster() {
        return 'https://image.tmdb.org/t/p/w780' + this.data.poster;
        // 780 x 1170
    }

    get director() {
        return this.data.director;
    }

    get year() {
        return this.data.released ? moment(this.data.released).year() : 'N/A';
    }

    get runtime() {
        if (!this.data.runtime)
            return null;
        var d = moment.duration(this.data.runtime, 'minutes'),
            l = [];
        if (d.hours() > 0)
            l.push(sprintf('%dh', d.hours()));
        if (d.minutes() > 0)
            l.push(sprintf('%dm', d.minutes()));
        return l.join(' e ');
    }

    get missing() {
        return this.data.released && moment(this.data.released).isBefore(moment(), 'day');
    }
}
