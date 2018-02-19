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
    }

    get name() {
        return this.data.name;
    }
}
