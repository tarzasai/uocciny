import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

/* */
import 'rxjs/add/operator/map';

/* */
import { AppComponent } from './app.component';
import { MessageService } from './utils/message.service';
import { ConfigService } from './utils/config.service';
import { DataService } from './api/data.service';
import { AppRoutingModule } from './/app-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MovieCardComponent } from './movie-card/movie-card.component';
import { SeriesCardComponent } from './series-card/series-card.component';

/* */
export function loadConfig(configService: ConfigService) {
	return () => configService.load();
}

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        MovieCardComponent,
        SeriesCardComponent,
    ],
    imports: [
        BrowserModule,
        HttpModule,
        HttpClientModule,
        AppRoutingModule
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
