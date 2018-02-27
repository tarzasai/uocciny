import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
    selector: 'title-parent',
    templateUrl: './title-parent.component.html',
    styleUrls: ['./title-parent.component.css']
})
export class TitleParentComponent implements ICellRendererAngularComp {
    private params: any;

    agInit(params: any): void {
        this.params = params;
    }

    refresh(params: any): boolean {
        return false;
    }
}
