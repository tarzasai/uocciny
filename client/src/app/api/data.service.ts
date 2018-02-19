import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';

export enum RequestType {
    movies = 'movies',
    series = 'series',
    episodes = 'episodes'
}

export class ServerResult {
    status = 0;
    result = [];

    get isError() {
        return this.status != 200;
    }
}

@Injectable()
export class DataService {

    constructor(private config: ConfigService, private messages: MessageService,
        private http: HttpClient) { }

    fetch(what: RequestType, args: any): Observable<any> {
        var url = this.config.apiHost + '/' + RequestType[what];
        return this.http
            .get<ServerResult>([url, this.args2uri(args)].join('?'))
            .pipe(
                map(res => {
                    if (res.isError)
                        throw res.result;
                    this.messages.addInfo("fetched data");
                    return res.result;
                }),
                catchError(this.handleError('fetch', []))
            );
    }

    private args2uri(dict) {
        var str = [];
        for (var p in (dict || {}))
            str.push([encodeURIComponent(p), encodeURIComponent(dict[p])].join('='));
        return str.join("&");
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error);
            this.messages.addError(error.message, operation);
            return of(result as T);
        };
    }
}
