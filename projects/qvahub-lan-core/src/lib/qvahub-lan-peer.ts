import { EventEmitter } from '@angular/core';
import { QvaHubLanClientType, QvaHubLanWebRTCType, QvaHubLanWebRTCClient } from './qvahub-lan-types';
import { QvaLoggerService} from './qva-logger.service';

export class QvahubLanPeer {

    private connection: RTCPeerConnection | null = null;
    private ws: WebSocket | null = null;
    private clientId: string = '';
	private clientType : QvaHubLanClientType | null = null;
    private availableHosts: string[] = [];

    private candidates: RTCIceCandidate[] = [];
    private isConnectionReady : boolean = false;
	private remoteHostWSId : string = '';

    private log: QvaLoggerService;
    constructor(log: QvaLoggerService) {
		this.log = log;
	}

	private hostListEvent = new EventEmitter<any>();
    getHostListEvents() {
        return this.hostListEvent;
    }

	toString() {
		return `${this.clientType?.toString()} ${this.clientId}`; 
	}

    wsConnect(serverIP: string, port: number, clientType: QvaHubLanClientType, clientName : string, args : any= {}) {
		this.clientType = clientType;
        this.ws = new WebSocket(`ws://${serverIP}:${port}`);
        
        this.ws.onopen = () => {
            this.ws?.send(JSON.stringify({
                type: 'register',
                clientType,
				clientName,
                webrtcType: QvaHubLanWebRTCType.PEER,
				args
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'registered':
                    this.clientId = data.clientId;
                    break;
                case 'hostAvailable':
                    this.availableHosts.push(data.hostId);
                    this.tryConnectToRandomHost();
                    break;
                case 'answer':
					this.remoteHostWSId = data.hostId;
                    this.handleAnswer(data.answer);
                    break;
                case 'candidate':
                    this.handleCandidate(data.candidate);
                    break;
				case 'hostList' :
					this.hostListEvent.emit(data.hosts);
					break;
            }
        };
    }

    private tryConnectToRandomHost() {
        if (this.availableHosts.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.availableHosts.length);
            const selectedHost = this.availableHosts[randomIndex];
            this.connectToHost(selectedHost);
        }
    }

	connectToHost(hostId: string) {

		this.log.log('Creating RTCPeerConnection',{},this.toString());

		this.connection = new RTCPeerConnection();

		// Add data channel
		const sendChannel = this.connection.createDataChannel("sendChannel");
		sendChannel.onopen = (event) => this.log.log('Data channel open',{},this.toString());
		sendChannel.onclose = (event) => this.log.log('Data channel closed',{},this.toString());

		this.connection.onicegatheringstatechange = () => {
			this.log.log('ICE gathering state changed:', this.connection?.iceGatheringState,this.toString());
		};

		this.connection.oniceconnectionstatechange = () => {
			this.log.log('ICE connection state changed:', this.connection?.iceConnectionState,this.toString());
		};

		this.connection.onconnectionstatechange = () => {
			this.log.log('Connection state changed:', this.connection?.connectionState,this.toString());
		};

		this.connection.onsignalingstatechange = () => {
			this.log.log('Signaling state changed:', this.connection?.signalingState,this.toString());
		};
		
		this.connection.onicecandidate = (event) => {
			this.log.log('onicecandidate event:', event.candidate ? 'candidate available' : 'null candidate',this.toString());
			if (event.candidate) {
				this.log.log('Sending ICE candidate to host:', hostId,this.toString());
				this.ws?.send(JSON.stringify({
					type: 'candidate',
					candidate: event.candidate,
					targetHost: hostId
				}));
			}
		};

		this.log.log('Creating offer',{},this.toString());
		this.connection.createOffer()
			.then(offer => {
				this.log.log('Offer created:', offer.type,this.toString());
				return this.connection?.setLocalDescription(offer);
			})
			.then(() => {
				this.log.log('Local description set, sending offer to host:', hostId,this.toString());
				this.ws?.send(JSON.stringify({
					type: 'offer',
					offer: this.connection?.localDescription,
					targetHost: hostId
				}));
			});
	}

	private handleAnswer(answer: RTCSessionDescription) {
		this.log.log('Received answer:', answer.type,this.toString());
		this.connection?.setRemoteDescription(answer)
			.then(() => {
				this.log.log('Remote description set successfully',{},this.toString());
				this.ws?.send(JSON.stringify({
					type: 'foundHost', 
					foundId: this.remoteHostWSId}));
			})
			.catch(error => {
				this.log.log('Error setting remote description:', error,this.toString());
			});
	}

	private handleCandidate(candidate: RTCIceCandidate) {
		this.log.log('Received ICE candidate from remote peer',{},this.toString());
		this.connection?.addIceCandidate(candidate)
			.then(() => {
				this.log.log('Added ICE candidate successfully',{},this.toString());
			})
			.catch(error => {
				this.log.log('Error adding ICE candidate:', error,this.toString());
			});
	}

}
