import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
    selector: 'title-parent',
    templateUrl: './title-parent.component.html',
    styleUrls: ['./title-parent.component.css']
})
export class TitleParentComponent implements ICellRendererAngularComp {
    private title: any = null;

    agInit(params: any): void {
        this.title = params;
    }

    refresh(params: any): boolean {
        //console.log('TitleParentComponent.refresh()', params);
        return false;
    }
}
