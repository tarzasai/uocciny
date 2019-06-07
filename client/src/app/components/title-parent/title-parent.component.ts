import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
    selector: 'app-title-parent',
    templateUrl: './title-parent.component.html',
    styleUrls: ['./title-parent.component.css']
})
export class TitleParentComponent implements ICellRendererAngularComp {
    title: any = null;

    agInit(params: import("ag-grid-community").ICellRendererParams): void {
        this.title = params;
    }

    refresh(params: any): boolean {
        return false;
    }

    /* afterGuiAttached?(params?: import("ag-grid-community").IAfterGuiAttachedParams): void {
        throw new Error("Method not implemented.");
    } */
}
