import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GameComponent} from './cubes/game.component';
import {VisualCubeComponent} from './cubes/visual/visual.cube.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    VisualCubeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
  ],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {
}
