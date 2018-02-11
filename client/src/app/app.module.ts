import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

/* */
import 'rxjs/add/operator/map';

/* */
import { AppComponent } from './app.component';
import { TitlesComponent } from './titles/titles.component';
import { MessageService } from './utils/message.service';
import { ConfigService } from './utils/config.service';

/* */
export function loadConfig(configService: ConfigService) {
	return () => configService.load();
}

@NgModule({
    declarations: [
        AppComponent,
        TitlesComponent,
    ],
    imports: [
        BrowserModule,
        HttpModule,
        HttpClientModule
    ],
    providers: [
        ConfigService,
        MessageService,
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
