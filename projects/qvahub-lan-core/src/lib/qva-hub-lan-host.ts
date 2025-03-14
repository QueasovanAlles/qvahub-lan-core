import { EventEmitter, Injectable } from '@angular/core';
import { QvaHubLanClientType, QvaHubLanWebRTCType, QvaHubLanWebRTCClient } from './qva-hub-lan-types';
import { QvaLoggerService} from './qva-logger.service';

@Injectable({
  providedIn: 'root'
})
export class QvaHubLanHost {

    private peerConnections = new Map<string, RTCPeerConnection>();
    private ws: WebSocket | null = null;
    private clientId: string = '';

	private clientType : QvaHubLanClientType | null = null;
    private log : QvaLoggerService;

    private streamEmitter = new EventEmitter<MediaStream>();

    getStream(clientId: string) {
        return this.streamEmitter.asObservable();
    }

	constructor(log: QvaLoggerService) {
		this.log = log;
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
                webrtcType: QvaHubLanWebRTCType.HOST,
				args
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'registered':
                    this.clientId = data.clientId;
                    break;
                case 'offer':
                    this.handleOffer(data.offer, data.peerId);
                    break;
                case 'candidate':
                    this.handleCandidate(data.candidate, data.clientId);
                    break;
            }
        };
    }

    private handleOffer(offer: RTCSessionDescription, peerId: string) {

		this.log.log('Creating RTCPeerConnection for peer:', peerId,this.toString());
		const peerConnection = new RTCPeerConnection();
		this.peerConnections.set(peerId, peerConnection);

		// Create data channel
		const dataChannel = peerConnection.createDataChannel("hostChannel");
		dataChannel.onopen = () => this.log.log('Data channel opened with peer:', peerId,this.toString());
		dataChannel.onclose = () => this.log.log('Data channel closed with peer:', peerId,this.toString());
		dataChannel.onmessage = (event) => this.log.log('Message received:', event.data,this.toString());

		peerConnection.onicecandidate = (event) => {
			this.log.log('ICE candidate event:', event.candidate ? 'candidate available' : 'null candidate',this.toString());
			if (event.candidate) {
				this.log.log('Sending ICE candidate to peer:', peerId,this.toString());
				this.ws?.send(JSON.stringify({
					type: 'candidate',
					candidate: event.candidate,
					targetClient: peerId
				}));
			}
		};

		peerConnection.onicegatheringstatechange = () => {
			this.log.log('ICE gathering state:', peerConnection.iceGatheringState,this.toString());
		};

		peerConnection.oniceconnectionstatechange = () => {
			this.log.log('ICE connection state:', peerConnection.iceConnectionState,this.toString());
		};

		peerConnection.onconnectionstatechange = () => {
			this.log.log('Connection state:', peerConnection.connectionState,this.toString());
		};

		peerConnection.onsignalingstatechange = () => {
			this.log.log('Signaling state:', peerConnection.signalingState,this.toString());
		};

		this.log.log('Setting remote description from offer',{},this.toString());
		peerConnection.setRemoteDescription(offer)
			.then(() => {
				this.log.log('Creating answer',{},this.toString());
				return peerConnection.createAnswer();
			})
			.then(answer => {
				this.log.log('Setting local description',{},this.toString());
				return peerConnection.setLocalDescription(answer);
			})
			.then(() => {
				this.log.log('Sending answer to peer:', peerId,this.toString());
				this.ws?.send(JSON.stringify({
					type: 'answer',
					answer: peerConnection.localDescription,
					targetClient: peerId,
					hostId: this.clientId
				}));
			});

		peerConnection.ontrack = (event:any) => {
			this.log.log('Received track:', event.track.kind, this.toString());
            this.streamEmitter.emit(event.streams[0]);
		};

	}

	private handleCandidate(candidate: RTCIceCandidate, peerId: string) {
		this.log.log('Received ICE candidate from peer:', peerId,this.toString());
		const peerConnection = this.peerConnections.get(peerId);
		peerConnection?.addIceCandidate(candidate)
			.then(() => this.log.log('Added ICE candidate successfully',{},this.toString()))
			.catch(error => this.log.log('Error adding ICE candidate:', error,this.toString()));
	}

}