import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RoomRegistryModule } from './RoomRegisteryModule/RoomRegistry.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RoomRegistryModule,
    BrowserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
