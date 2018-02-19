import { Title, TitleType } from './title';
import * as moment from 'moment';

export class Episode extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.episode;
    }

    get plot() {
        return this.data.plot;
    }
}
