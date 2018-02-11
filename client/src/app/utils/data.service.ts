import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { ConfigService } from '../utils/config.service';
import { MessageService } from '../utils/message.service';

export class ServerResult {
    status: string;
    result: any;

    get isError() {
        return this.status != 'success';
    }
}

@Injectable()
export class DataService {

    private _data: any = {};

    constructor(private config: ConfigService, private messages: MessageService,
        private http: HttpClient) { }

    reset() {
        this._data = {};
    }

    get data(): Observable<any> {
        return Object.keys(this._data).length ? of(this._data) : this.http
            .get<ServerResult>(this.config.apiHost + '/data')
            .pipe(
                map(res => {
                    if (res.isError)
                        throw res.result;
                    this._data = res.result;
                    this.messages.addInfo("fetched data");
                    return this._data;
                }),
                catchError(this.handleError('getData', this._data || {}))
            );
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error);
            this.messages.addError(error.message, operation);
            return of(result as T);
        };
    }

}
