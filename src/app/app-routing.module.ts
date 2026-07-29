import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {GameComponent} from './cubes/game.component';
import {HomeComponent} from './home/home.component';

const routes: Routes = [
  {path: '', pathMatch: 'full', component: HomeComponent},
  {path: 'local', component: GameComponent, data: {mode: 'local'}},
  {path: 'ai', component: GameComponent, data: {mode: 'ai'}},
  {path: 'online', component: GameComponent, data: {mode: 'online'}},
  // Legacy route kept as an alias for the original local game.
  {path: 'cube', component: GameComponent, data: {mode: 'local'}},
  {path: '**', redirectTo: ''},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
