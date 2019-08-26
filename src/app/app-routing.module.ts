import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GameComponent } from './cubes/game.component';

const routes: Routes = [
                        { path: '', pathMatch: 'full', redirectTo: '/cube' },
                        { path: 'cube', component: GameComponent }
                        ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
