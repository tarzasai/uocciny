import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { SeriesFormComponent } from '../series-form/series-form.component';

@Injectable()
export class ModalService {
    modalRef: BsModalRef;

    constructor(private modalService: BsModalService) { }

    openSeries(seriesRef) {
        this.modalRef = this.modalService.show(SeriesFormComponent, {
            initialState: { series: seriesRef },
            animated: true,
            keyboard: true
        });
    }
}
