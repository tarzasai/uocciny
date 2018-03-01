import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { RatingModule } from 'ngx-bootstrap/rating';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AgGridModule } from "ag-grid-angular/main";

/* */
import 'rxjs/add/operator/map';

/* */
import { AppComponent } from './app.component';
import { MessageService } from './utils/message.service';
import { ConfigService } from './utils/config.service';
import { DataService } from './api/data.service';
import { KeysPipe } from './utils/keys.pipe';
import { ValuesPipe } from './utils/values.pipe';
import { TitleCellComponent } from './title-cell/title-cell.component';
import { TitleParentComponent } from './title-parent/title-parent.component';
import { MovieCardComponent } from './movie-card/movie-card.component';
import { SeriesCardComponent } from './series-card/series-card.component';

/* */
export function loadConfig(configService: ConfigService) {
	return () => configService.load();
}

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        HttpClientModule,
        FormsModule,
        ButtonsModule.forRoot(),
        RatingModule.forRoot(),
        ModalModule.forRoot(),
        AgGridModule.withComponents([
            TitleParentComponent
        ]),
    ],
    providers: [
        ConfigService,
        MessageService,
        DataService,
		{
			provide: APP_INITIALIZER,
			useFactory: loadConfig,
			deps: [ ConfigService ],
			multi: true,
		}
    ],
    declarations: [
        AppComponent,
        TitleCellComponent,
        TitleParentComponent,
        MovieCardComponent,
        SeriesCardComponent,
        KeysPipe,
        ValuesPipe,
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }
