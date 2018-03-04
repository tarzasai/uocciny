import { Injectable, EventEmitter } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { Http } from '@angular/http';

import { map, filter, scan } from 'rxjs/operators';

@Injectable()
export class ConfigService {
    cfg: any = null;
    basehref = null;

    constructor(private http: Http, pl: PlatformLocation) {
        this.basehref = (pl as any).getBaseHrefFromDOM();
        console.log(this.basehref);
    }

    load(): Promise<any> {
        this.cfg = null;
        return this.http
            .get(this.basehref + 'config.json')
            .pipe(map((res) => res.json()))
            .toPromise()
            .then((data: any) => (this.cfg = data))
            .catch((err: any) => Promise.resolve());
    }

    get apiHost(): string {
        return this.cfg['service'];
    }
}
