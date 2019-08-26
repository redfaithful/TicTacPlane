import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { GameComponent } from './cubes/game.component';
import { VisualCubeComponent } from './cubes/visual/visual.cube.component';

@NgModule( {
    declarations: [
        AppComponent,
        GameComponent,
        VisualCubeComponent,
    ],
    entryComponents: [GameComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
} )
export class AppModule { }
