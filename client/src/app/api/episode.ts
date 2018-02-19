import { Title, TitleType } from './title';
import { sprintf } from 'sprintf';
import * as moment from 'moment';

export class Episode extends Title {

    constructor(data: any) {
        super(data);
        this.type = TitleType.episode;
        var s = (this.data.subtitles || []);
        s.find(function(itm, idx, lst) {
            if (itm === 'und')
                lst[idx] = 'unknown';
        });
        s.sort();
    }

    get eid() {
        //return sprintf('S%02dE%02d', this.data.season, this.data.episode);
        return sprintf('%dx%d', this.data.season, this.data.episode);
    }

    get title() {
        return this.data.title || 'N/A';
    }

    get plot() {
        return this.data.plot;
    }

    get subs() {
        return this.data.subtitles ? this.data.subtitles.join(', ') : null;
    }
}
