import { Component, OnInit } from '@angular/core';

import { DataService } from '../utils/data.service';

@Component({
    selector: 'app-titles',
    templateUrl: './titles.component.html',
    styleUrls: ['./titles.component.css']
})
export class TitlesComponent implements OnInit {

    constructor(private data: DataService) { }

    ngOnInit() {
    }

}
