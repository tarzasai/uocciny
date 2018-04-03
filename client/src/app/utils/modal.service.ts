import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { SeriesFormComponent } from '../series-form/series-form.component';
import { SearchFormComponent } from '../search-form/search-form.component';

@Injectable()
export class ModalService {
    modalRef: BsModalRef;

    constructor(private modalService: BsModalService) { }

    openSeries(seriesRef, seasonNo=null) {
        this.modalRef = this.modalService.show(SeriesFormComponent, {
            initialState: { series: seriesRef, season: seasonNo },
            animated: true,
            keyboard: true
        });
    }

    openSearch(searchTerm) {
        this.modalRef = this.modalService.show(SearchFormComponent, {
            initialState: { searchTerm: searchTerm },
            animated: true,
            keyboard: true
        });
    }
}
