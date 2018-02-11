import { Injectable, EventEmitter } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { Http } from '@angular/http';
import { map, filter, scan } from 'rxjs/operators';

@Injectable()
export class ConfigService {
    cfg: any = null;
    basehref = null;

    lockRequests = 0;

    confirmPrompt = null;
    confirmSecure = false;
    confirmEmitter: EventEmitter<any> = new EventEmitter();

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

    get locked(): boolean {
        return this.lockRequests > 0 || this.confirmPrompt;
    }

    lockScreen() {
        this.lockRequests++;
    }

    unlockScreen() {
        this.lockRequests--;
    }

    emitConfirmEvent(res:boolean, pwd:string) {
        this.confirmEmitter.emit(!res ? false : this.confirmSecure ? pwd : true);
        this.confirmPrompt = null;
        this.confirmSecure = false;
    }

    getConfirmEmitter(prompt:string, secure:boolean) {
        this.confirmPrompt = prompt;
        this.confirmSecure = secure;
        return this.confirmEmitter;
    }
}
