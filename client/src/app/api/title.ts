import * as moment from 'moment';

export enum TitleType {
    movie,
    series,
    episode
}

export class Title {
    type: TitleType;
    data: any;

    constructor(data: any) {
        this.load(data);
    }

    load(value:any) {
        this.data = value;
        if (this.data.subtitles) {
            this.data.subtitles.sort();
            this.data.subtitles.find(function (itm, idx, lst) {
                if (itm === 'und')
                    lst[idx] = '<?>';
            });
        }
    }

    get error() {
        return this.data.error;
    }

    get imdbUrl() {
        return this.data.imdb_id && this.data.imdb_id != '' ? 'http://www.imdb.com/title/' + this.data.imdb_id : null;
    }

    get title() {
        return this.data.name || 'N/A';
    }

    get plot() {
        return this.data.plot;
    }

    get watchlist() {
        return this.data.watchlist;
    }

    get collected() {
        return this.data.collected;
    }

    get watched() {
        return this.data.watched;
    }

    get rating() {
        return this.data.rating;
    }

    get subtitles() {
        return this.data.subtitles ? this.data.subtitles.join(', ') : null;
    }
}
