import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { AgGridModule } from "ag-grid-angular/main";

/* */
import 'rxjs/add/operator/map';

/* */
import { AppComponent } from './app.component';
import { MessageService } from './utils/message.service';
import { ConfigService } from './utils/config.service';
import { DataService } from './api/data.service';
import { TitleCellComponent } from './title-cell/title-cell.component';
import { TitleParentComponent } from './title-parent/title-parent.component';
/*
import { DashboardComponent } from './dashboard/dashboard.component';
import { MovieCardComponent } from './movie-card/movie-card.component';
import { SeriesCardComponent } from './series-card/series-card.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { MissingsComponent } from './missings/missings.component';
import { EverythingComponent } from './everything/everything.component';
*/

/* */
export function loadConfig(configService: ConfigService) {
	return () => configService.load();
}

@NgModule({
    declarations: [
        AppComponent,
        TitleCellComponent,
        TitleParentComponent,
        /*DashboardComponent,
        MovieCardComponent,
        SeriesCardComponent,
        WatchlistComponent,
        MissingsComponent,
        EverythingComponent,*/
    ],
    imports: [
        BrowserModule,
        HttpModule,
        HttpClientModule,
        ButtonsModule.forRoot(),
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
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }
