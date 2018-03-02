import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Movie extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.movie;
    }

    sortKey():string {
        return super.sortKey() + (!this.date ? 'zzzzzzzz' : this.date.isBefore(moment(), 'day') ?
            (this.date.year() + '0000') : this.date.format('YYYYMMDD')) +
            (this.data.name || 'zzzzzzzzzz').toLocaleLowerCase();
    }

    get poster() {
        return this.data.poster ? 'https://image.tmdb.org/t/p/w780' + this.data.poster : null;
        // 780 x 1170
    }

    get director() {
        return this.data.director;
    }

    get date() {
        return this.data.released ? moment(this.data.released) : null;
    }

    get runtime() {
        if (!this.data.runtime)
            return null;
        var d = moment.duration(this.data.runtime, 'minutes'),
            l = [];
        if (d.hours() > 0)
            l.push(sprintf('%dh', d.hours()));
        if (d.minutes() > 0)
            l.push(sprintf("%d'", d.minutes()));
        return l.join(' ');
    }

    get available() {
        return this.collected && !this.watched;
    }

    get missing() {
        return this.data.missing;
    }
}
