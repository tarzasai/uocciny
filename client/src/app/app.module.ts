import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { RatingModule } from 'ngx-bootstrap/rating';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { AgGridModule } from "ag-grid-angular/main";

import { AppComponent } from './app.component';
import { KeysPipe } from './utils/keys.pipe';
import { ValuesPipe } from './utils/values.pipe';
import { MessageService } from './utils/message.service';
import { ModalService } from './utils/modal.service';
import { DataService } from './api/data.service';
import { TitleParentComponent } from './components/title-parent/title-parent.component';
import { TitleCellComponent } from './components/title-cell/title-cell.component';
import { MovieCardComponent } from './components/movie-card/movie-card.component';
import { SeriesFormComponent } from './components/series-form/series-form.component';
import { SeriesCardComponent } from './components/series-card/series-card.component';
import { SearchFormComponent } from './components/search-form/search-form.component';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        HttpClientModule,
        FormsModule,
        ButtonsModule.forRoot(),
        RatingModule.forRoot(),
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        AgGridModule.withComponents([
            TitleParentComponent
        ]),
    ],
    providers: [
        MessageService,
        ModalService,
        DataService
    ],
    declarations: [
        AppComponent,
        KeysPipe,
        ValuesPipe,
        TitleParentComponent,
        TitleCellComponent,
        MovieCardComponent,
        SeriesFormComponent,
        SeriesCardComponent,
        SearchFormComponent
    ],
    entryComponents: [
        SeriesFormComponent,
        SearchFormComponent,
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }
