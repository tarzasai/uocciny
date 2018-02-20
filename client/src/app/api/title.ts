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
        this.data = data;
        if (this.data.subtitles) {
            this.data.subtitles.sort();
            this.data.subtitles.find(function(itm, idx, lst) {
                if (itm === 'und')
                    lst[idx] = '<?>';
            });
        }
    }

    get imdb() {
        return this.data.imdb_id && this.data.imdb_id != '' ? 'http://www.imdb.com/title/' + this.data.imdb_id : null;
    }

    get title() {
        return this.data.name;
    }

    get plot() {
        return this.data.plot;
    }

    get subtitles() {
        return this.data.subtitles ? this.data.subtitles.join(', ') : null;
    }

    get watchlist():boolean {
        return this.data.watchlist;
    }

    get collected():boolean {
        return this.data.collected;
    }

    get watched():boolean {
        return this.data.watched;
    }
}
