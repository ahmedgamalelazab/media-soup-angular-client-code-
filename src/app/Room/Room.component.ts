import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { Device, types } from 'mediasoup-client';

@Component({
  selector: 'app-room',
  templateUrl: './Room.component.html',
  styleUrls: ['./Room.component.scss'],
})
export class RoomComponent implements OnInit, AfterViewInit {
  //STEP 3️⃣ ALLOW THE DEVICE ASK FOR WebrtcTransport
  device: Device | undefined;

  producerTransport: types.Transport | undefined;

  consumerTransport: types.Transport | undefined;

  rtpCapabilities: types.RtpCapabilities | undefined;

  producer: types.Producer | undefined;

  consumer: types.Consumer | undefined;

  //mediasoup params
  params: any = {
    encoding: [
      {
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3',
      },
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };

  videoRef: any;
  remoteVideo:any;

  constructor(
    private activateRoute: ActivatedRoute,
    private socket: Socket,
    private elRef: ElementRef
  ) {
    this.socket.on('message', (message: any) => {
      switch (message.type) {
        case 'connection-success':
          console.log(JSON.stringify(message.data));
          break;
        case 'serverWithResponseRtpCapabilities':
          console.log(JSON.stringify(message.data));
          this.rtpCapabilities = message.data;
          console.log(JSON.stringify(this.rtpCapabilities));
          break;
        default:
          break;
      }
    });
  }
  ngAfterViewInit(): void {}

  roomId = this.activateRoute.snapshot.params['id']; //ROOM ID

  ngOnInit() {
    this.videoRef = window.document.getElementById('localvideo');
    console.log(this.videoRef);
    this.remoteVideo = window.document.getElementById('remoteVideo');
    console.log(this.remoteVideo);

  }

  //get local stream //TODO TRANSFERE THE CODE TO SERVICE LATER
  getLocalAudio(){
    navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: {
        width: {
          min: 640,
          max: 1920,
        },
        height: {
          min: 400,
          max: 1080,
        },
      },
    })
    .then((s: MediaStream) => {
      console.log(window.document.getElementById('localvideo'));

      this.videoRef.srcObject = s;

      let track = s.getAudioTracks()[0];

      console.log(track);
      //update the mediasoup track
      // this.params = {
      //   track,
      //   ...this.params,
      // };

      this.params.track = track;

      console.warn(this.params);
    })
    .catch((error) => {
      console.log(error);
    });
  }
  getLocalStream(): void {
    //getting local stream from the user
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          width: {
            min: 640,
            max: 1920,
          },
          height: {
            min: 400,
            max: 1080,
          },
        },
      })
      .then((s: MediaStream) => {
        console.log(window.document.getElementById('localvideo'));

        this.videoRef.srcObject = s;

        let track = s.getVideoTracks()[0];

        console.log(track);
        //update the mediasoup track
        this.params = {
          track,
          ...this.params,
        };

        console.warn(this.params);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  //we will be asking the router for his rtpCapabilities
  getRtpCapabilities(): void {
    this.socket.emit('message', {
      type: 'getRtpCapabilities',
    });
  }

  createDevice(): void {
    console.log('called created device!');
    console.log(this.rtpCapabilities);
    try {
      this.device = new Device(); // create the device and then load it then listen on it
      this.device
        ?.load({
          routerRtpCapabilities: this.rtpCapabilities!, // iam sure that i won't call this unless i ask first for the router capabilities
        })
        .then((e) => {
          console.log(
            'device Loaded successfully with state loaded : ' +
              this.device?.loaded +
              ''
          );
        });
    } catch (error: any) {
      console.log(error);
      if (error.name === 'UnsupportedError')
        console.warn('browser not supported');
    }
  }

  createSendTransport(): void {
    this.socket.on('message', (message: any) => {
      if (message.type === 'createdWebRTCtransport') {
        if (message.params.error) {
          console.log(message.params.error);
          return;
        }
        //else
        console.log(message.params);

        //if there's params
        this.producerTransport = this.device?.createSendTransport(
          message.params
        );

        this.producerTransport?.on(
          'connect',
          async ({ dtlsParameters }, callback, errCallback) => {
            console.warn('producerTransport on connect ! ! ');
            try {
              //signal local dtls prarams to the server side transport
              this.socket.emit('message', {
                type: 'transport-connect',
                params: {
                  transportId: this.producerTransport?.id,
                  dtlsParameters: dtlsParameters,
                },
              });
              //tell the transport that the parameters were transmitted
              callback();
            } catch (error: any) {
              console.log(error);
              errCallback(errCallback);
            }
          }
        );

        this.producerTransport?.on(
          'produce',
          async (parameters, callback, errback) => {
            console.warn('producerTransport on produce ! ! ');
            //TODO
            this.socket.on('message', (message: any) => {
              if (message.type === 'serverProducerId') {
                const id = message.id;
                callback({ id });
              }
            });
            console.log(parameters);
            try {
              this.socket.emit('message', {
                type: 'transport-produce',
                params: {
                  transportId: this.producerTransport?.id,
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                },
              });
            } catch (error: any) {
              console.log(error);
              errback(error);
            }
          }
        );
      }
    });

    //ask the server for WRTCTransport
    this.socket.emit('message', {
      type: 'createWebRTCtransport',
      sender: true, //that will make the server knows if the request from sender or from recv
    });
  }

  connectSendTransport(): void {
    this.producerTransport?.produce(this.params).then((prod) => {
      this.producer = prod;

      this.producer.on('trackended', () => {
        console.log('track ended');

        //close the video track
      });

      this.producer.on('transportclose', () => {
        console.log('track ended');

        //close the video track
      });
    });
  }

  //ask the server for recv transport
  createRecvTransport(): void {
    this.socket.on('message', (message: any) => {
      if (message.type === 'createdWebRTCtransport') {
        if (message.params.error) {
          console.log(message.params.error);
          return;
        }
        //else
        console.warn('consumer params : ');
        console.log(message.params);

        //create recv transport which will later will call consume

        this.consumerTransport = this.device?.createRecvTransport(message.params);

        this.consumerTransport?.on('connect',({dtlsParameters},callback,errCallback)=>{
          console.warn('consumerTransport on connect ! ! ');
          try{

            this.socket.emit("message",{
              type:"transport-recv-connect",
              params:{
                transportId:this.consumerTransport?.id,
                dtlsParameters : dtlsParameters,
              }
            })
            //tell the transport that the parameters has transmitted
            callback();

          }catch(error:any){
            console.log(error);
            errCallback(error);
          }
        })

      }
    });

    //ask the server for WRTCTransport
    //if the sender is === false that's mean iam recv ok ?
    this.socket.emit('message', {
      type: 'createWebRTCtransport',
      sender: false, //that will make the server knows if the request from sender or from recv
    });
  }


  connectRcvTransport():void{

    this.socket.on("message",(message:any)=>{
        if(message.type = "onsServerParams"){
            if(message.params.error){
                console.log("cannot consume");
                return;
            }
            console.warn(`server is able to consume ! : ${JSON.stringify(message.params)}`);
            console.log(message.params.kind);

            this.consumerTransport?.consume({
                rtpParameters:message.params.rtpParameters,
                kind:message.params.kind,
                id:message.params.id, //SERVER CONSUMER ID
                producerId:message.params.producerId
            }).then((cons)=>{
              this.consumer = cons;
              const {track} = this.consumer;
              console.warn(track);
              this.remoteVideo.srcObject = new MediaStream([track]);

              this.socket.emit("message",{
                type:"consumer-resume"
              })
            }).catch((error:any)=>{
              console.log(error);
            })

        }
    })

    this.socket.emit('message',{
      type:"consume",
      rtpCapabilities:this.device?.rtpCapabilities
    })



  }

}
