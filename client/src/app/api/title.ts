import * as moment from 'moment';

export enum TitleType {
    movie,
    series,
    episode
}

export class Title {
    type: TitleType;
    data: any;
    date: moment.Moment;
    missing: any;
    available: any;

    constructor(data: any) {
        if (!data)
            throw new Error('Invalid data!');
        this.load(data);
    }

    load(value:any) {
        if (value == null)
            return;
        this.data = value;
        if (this.data.subtitles) {
            this.data.subtitles.sort();
            this.data.subtitles.find(function (itm, idx, lst) {
                if (itm === 'und')
                    lst[idx] = '<?>';
            });
        }
    }

    hasText(text) {
        text = text.toLocaleLowerCase();
        return (this.data.name || '').toLocaleLowerCase().contains(text) ||
            (this.data.imdb_id || '').toLocaleLowerCase().contains(text);
    }

    sortKey():string {
        return this.type === TitleType.series ? '000000' : this.type === TitleType.movie ? '111111' : '222222';
    }

    dateAsText(rough=null) {
        return !this.date ? null : rough ? this.date.fromNow() : this.date.format('DD/MM/YYYY');
    }

    get isMovie() {
        return this.type === TitleType.movie;
    }

    get isSeries() {
        return this.type === TitleType.series;
    }

    get isEpisode() {
        return this.type === TitleType.episode;
    }

    get error() {
        return this.data.error;
    }

    get imdbUrl() {
        return this.imdb_id && this.imdb_id != '' ? 'http://www.imdb.com/title/' + this.imdb_id : null;
    }

    get imdb_id() {
        return this.data.imdb_id;
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

    get isBefore() {
        return this.date && this.date.isBefore(moment(), 'day')
    }

    get isToday() {
        return this.date && this.date.isSame(moment(), 'day')
    }

    get isAfter() {
        return this.date && this.date.isAfter(moment(), 'day')
    }
}
