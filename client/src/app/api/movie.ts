import { Title, TitleType } from './title';
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
}
