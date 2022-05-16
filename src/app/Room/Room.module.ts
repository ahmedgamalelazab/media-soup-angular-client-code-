import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import {RoomComponent} from './Room.component';


@NgModule({
  declarations: [
    RoomComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forChild([
      {path:"room/:id",component:RoomComponent}
    ]),
  ],
  exports:[],
})
export class RoomModule { }
