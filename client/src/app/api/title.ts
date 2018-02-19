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
    }

    get name() {
        return this.data.name;
    }
}

export class Movie extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.movie;
    }

    get poster() {
        return 'https://image.tmdb.org/t/p/w780' + this.data.poster;
        // 780 x 1170
        //
    }
}

export class Series extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.series;
    }

    get poster() {
        return 'https://www.thetvdb.com/banners/' + this.data.poster;
        // 680 x 1000
        //
    }
}

export class Episode extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.episode;
    }
}
