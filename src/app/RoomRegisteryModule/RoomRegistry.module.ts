import { RoomModule } from './../Room/Room.module';
import { BrowserModule } from '@angular/platform-browser';
//this is the module that will contain the main room entry point module
import { NgModule } from '@angular/core';

import { RoomRegistryComponent } from './RoomRegistry.component';

import { RouterModule , Routes } from '@angular/router';
import { ReactiveFormsModule} from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';



@NgModule({
  declarations: [RoomRegistryComponent],
  imports: [
    ReactiveFormsModule,
    BrowserModule,
    SocketIoModule.forRoot({ url:'https://localhost:3000', options: {

    } }),
    RouterModule.forRoot([
      {path:'',component:RoomRegistryComponent},
      {path:"**",redirectTo:'/',pathMatch:"full"}
    ]),
    RoomModule,
  ],
  exports: [
    BrowserModule,
    RouterModule,
    ReactiveFormsModule,
    SocketIoModule
  ],
  providers: [],
})
export class RoomRegistryModule { }
