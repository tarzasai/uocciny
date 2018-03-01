import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Movie extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.movie;
    }

    sortKey():string {
        return super.sortKey() + (this.data.released || 'zzzz').substr(0, 4) +
            (this.data.name || 'zzzzzzzzzz').toLocaleLowerCase();
    }

    get poster() {
        return this.data.poster ? 'https://image.tmdb.org/t/p/w780' + this.data.poster : null;
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

    get available() {
        return this.collected && !this.watched;
    }

    get missing() {
        return this.data.missing;
    }
}
