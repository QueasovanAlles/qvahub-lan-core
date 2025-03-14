"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QvahubLanHost = void 0;
const qvahub_lan_types_1 = require("./qvahub-lan-types");
class QvahubLanHost {
    constructor(log) {
        this.peerConnections = new Map();
        this.ws = null;
        this.clientId = '';
        this.clientType = null;
        this.log = log;
    }
    toString() {
        var _a;
        return `${(_a = this.clientType) === null || _a === void 0 ? void 0 : _a.toString()} ${this.clientId}`;
    }
    wsConnect(serverIP, port, clientType, clientName, args = {}) {
        this.clientType = clientType;
        this.ws = new WebSocket(`ws://${serverIP}:${port}`);
        this.ws.onopen = () => {
            var _a;
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                type: 'register',
                clientType,
                clientName,
                webrtcType: qvahub_lan_types_1.QvaHubLanWebRTCType.HOST,
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
    handleOffer(offer, peerId) {
        this.log.log('Creating RTCPeerConnection for peer:', peerId, this.toString());
        const peerConnection = new RTCPeerConnection();
        this.peerConnections.set(peerId, peerConnection);
        // Create data channel
        const dataChannel = peerConnection.createDataChannel("hostChannel");
        dataChannel.onopen = () => this.log.log('Data channel opened with peer:', peerId, this.toString());
        dataChannel.onclose = () => this.log.log('Data channel closed with peer:', peerId, this.toString());
        dataChannel.onmessage = (event) => this.log.log('Message received:', event.data, this.toString());
        peerConnection.onicecandidate = (event) => {
            var _a;
            this.log.log('ICE candidate event:', event.candidate ? 'candidate available' : 'null candidate', this.toString());
            if (event.candidate) {
                this.log.log('Sending ICE candidate to peer:', peerId, this.toString());
                (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate,
                    targetClient: peerId
                }));
            }
        };
        peerConnection.onicegatheringstatechange = () => {
            this.log.log('ICE gathering state:', peerConnection.iceGatheringState, this.toString());
        };
        peerConnection.oniceconnectionstatechange = () => {
            this.log.log('ICE connection state:', peerConnection.iceConnectionState, this.toString());
        };
        peerConnection.onconnectionstatechange = () => {
            this.log.log('Connection state:', peerConnection.connectionState, this.toString());
        };
        peerConnection.onsignalingstatechange = () => {
            this.log.log('Signaling state:', peerConnection.signalingState, this.toString());
        };
        this.log.log('Setting remote description from offer', {}, this.toString());
        peerConnection.setRemoteDescription(offer)
            .then(() => {
            this.log.log('Creating answer', {}, this.toString());
            return peerConnection.createAnswer();
        })
            .then(answer => {
            this.log.log('Setting local description', {}, this.toString());
            return peerConnection.setLocalDescription(answer);
        })
            .then(() => {
            var _a;
            this.log.log('Sending answer to peer:', peerId, this.toString());
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                type: 'answer',
                answer: peerConnection.localDescription,
                targetClient: peerId,
                hostId: this.clientId
            }));
        });
    }
    handleCandidate(candidate, peerId) {
        this.log.log('Received ICE candidate from peer:', peerId, this.toString());
        const peerConnection = this.peerConnections.get(peerId);
        peerConnection === null || peerConnection === void 0 ? void 0 : peerConnection.addIceCandidate(candidate).then(() => this.log.log('Added ICE candidate successfully', {}, this.toString())).catch(error => this.log.log('Error adding ICE candidate:', error, this.toString()));
    }
}
exports.QvahubLanHost = QvahubLanHost;
