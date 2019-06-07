import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { sprintf } from 'sprintf-js';
import { catchError, map } from 'rxjs/operators';
import { Observable, Subject, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { MessageService } from '../utils/message.service';
import { Title } from './title';

export enum RetrieveType {
    movies = 'movies',
    series = 'series',
    episodes = 'episodes'
}

export enum UpdateType {
    movie = 'movie',
    series = 'series',
    season = 'season',
    episode = 'episode'
}

export class ServerResult {
    status = 0;
    result = [];

    get isError() {
        return this.status != 200;
    }
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
    onUpdate: Subject<Title> = new Subject();
    lockRequests = 0;

    constructor(private http: HttpClient, private messages: MessageService) { }

    retrieve(what: RetrieveType, args: any): Observable<any> {
        var url = environment.apiHost + '/' + RetrieveType[what];
        return this.http
            .get<ServerResult>([url, this.args2uri(args)].join('?'))
            .pipe(
                map(res => {
                    if (res.isError || res.status != 200)
                        throw res.result;
                    return res.result;
                }),
                catchError(this.handleError('retrieve', []))
            );
    }

    update(what: UpdateType, args: any): Observable<any> {
        var url = environment.apiHost + '/' + UpdateType[what];
        return this.http
            .post<ServerResult>(url, args)
            .pipe(
                map(res => {
                    if (res.isError || res.status != 200)
                        throw res.result;
                    return res.result;
                }),
                catchError(this.handleError('update', []))
            );
    }

    search(text): Observable<any> {
        var url = environment.apiHost + '/searchtvdb/' + text;
        return this.http
            .get<ServerResult>(url)
            .pipe(
                map(res => {
                    if (res.isError || res.status != 200)
                        throw res.result;
                    return res.result;
                }),
                catchError(this.handleError('search', []))
            );
    }

    import(): Observable<any> {
        var url = environment.apiHost + '/importimdb';
        return this.http
            .post<ServerResult>(url, null)
            .pipe(
                map(res => {
                    if (res.isError || res.status != 200)
                        throw res.result;
                    this.messages.addInfo(sprintf('%d movie(s) added.', res.result.length));
                    return res.result;
                }),
                catchError(this.handleError('import', []))
            );
    }

    cleanup(): Observable<any> {
        var url = environment.apiHost + '/cleanup';
        return this.http
            .post<ServerResult>(url, null)
            .pipe(
                map(res => {
                    if (res.isError || res.status != 200)
                        throw res.result;
                    this.messages.addInfo(sprintf('%d orphan(s) deleted.', res.result));
                    return res.result;
                }),
                catchError(this.handleError('cleanup', 0))
            );
    }

    lockScreen() {
        this.lockRequests++;
    }

    unlockScreen() {
        this.lockRequests--;
    }

    get locked(): boolean {
        return this.lockRequests > 0;
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
            this.messages.addError(error.message || error, operation);
            return of(result as T);
        };
    }
}
