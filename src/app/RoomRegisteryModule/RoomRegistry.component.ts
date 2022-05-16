import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

// import { Device } from 'mediasoup-client';



@Component({
  selector: 'app-RoomEntry',
  templateUrl: './RoomRegistry.component.html',
  styleUrls: ['./RoomRegistry.component.scss'],
})
export class RoomRegistryComponent implements OnInit {
  helloWorld: string = 'hello world';

  //setting up the form .. // so damn simple from here


  constructor(private fb:FormBuilder, private router:Router) {

  }

  roomFormGroup = this.fb.group({
    userName:[''],
  })

  ngOnInit() {}

  joinRoomSubmitButton():void{
    this.router.navigate([`/room/${this.roomFormGroup.value['userName']}`]);
  }

}
