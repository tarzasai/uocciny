import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { MessageService } from '../../utils/message.service';
import { DataService, UpdateType } from '../../api/data.service';
import { Series } from '../../api/series';

@Component({
    selector: 'app-search-form',
    templateUrl: './search-form.component.html',
    styleUrls: ['./search-form.component.css']
})
export class SearchFormComponent implements OnInit {
    searchTerm: any;
    data: any;

    constructor(public modalRef: BsModalRef, public messages: MessageService, private api: DataService) {
    }

    ngOnInit() {
        this.api.lockScreen();
        var res = [];
        this.api.search(this.searchTerm).subscribe(result => {
            result.forEach(function (itm) {
                if (itm.banner && itm.overview && itm.status)
                    res.push(itm);
            });
            res.sort(function (t1, t2) {
                return (t1.firstAired || '9999-99-99').localeCompare(t2.firstAired || '9999-99-99');
            });
            this.data = res;
            this.api.unlockScreen();
        });
    }

    add2watchlist(tvdb_id) {
        this.api.lockScreen();
        this.api.update(UpdateType.series, {
            tvdb_id: tvdb_id,
            watchlist: 1
        }).subscribe(result => {
            this.data.forEach(function (itm) {
                if (itm.id === tvdb_id)
                    itm.watchlist = true;
            });
            this.api.onUpdate.next(new Series(result[0]));
            this.api.unlockScreen();
        });
    }
}
