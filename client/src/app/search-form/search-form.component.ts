import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { MessageService } from '../utils/message.service';
import { DataService } from '../api/data.service';

@Component({
    selector: 'app-search-form',
    templateUrl: './search-form.component.html',
    styleUrls: ['./search-form.component.css']
})
export class SearchFormComponent implements OnInit {

    constructor(public modalRef: BsModalRef, public messages: MessageService, private api: DataService) {
    }

    ngOnInit() {
    }

}
