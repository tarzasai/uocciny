import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WatchlistComponent } from './watchlist/watchlist.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MissingsComponent } from './missings/missings.component';
import { EverythingComponent } from './everything/everything.component';

const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'watchlist', component: WatchlistComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'missings', component: MissingsComponent },
    { path: 'everything', component: EverythingComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
