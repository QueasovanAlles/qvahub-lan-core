"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QvahubLanPeer = void 0;
const core_1 = require("@angular/core");
const qvahub_lan_types_1 = require("./qvahub-lan-types");
class QvaHubLanPeer {
    constructor(log) {
        this.connection = null;
        this.ws = null;
        this.clientId = '';
        this.clientType = null;
        this.availableHosts = [];
        this.candidates = [];
        this.isConnectionReady = false;
        this.remoteHostWSId = '';
        this.hostListEvent = new core_1.EventEmitter();
        this.log = log;
    }
    getHostListEvents() {
        return this.hostListEvent;
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
                webrtcType: qvahub_lan_types_1.QvaHubLanWebRTCType.PEER,
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
                case 'hostList':
                    this.hostListEvent.emit(data.hosts);
                    break;
            }
        };
    }
    tryConnectToRandomHost() {
        if (this.availableHosts.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.availableHosts.length);
            const selectedHost = this.availableHosts[randomIndex];
            this.connectToHost(selectedHost);
        }
    }
    connectToHost(hostId) {
        this.log.log('Creating RTCPeerConnection', {}, this.toString());
        this.connection = new RTCPeerConnection();
        // Add data channel
        const sendChannel = this.connection.createDataChannel("sendChannel");
        sendChannel.onopen = (event) => this.log.log('Data channel open', {}, this.toString());
        sendChannel.onclose = (event) => this.log.log('Data channel closed', {}, this.toString());
        this.connection.onicegatheringstatechange = () => {
            var _a;
            this.log.log('ICE gathering state changed:', (_a = this.connection) === null || _a === void 0 ? void 0 : _a.iceGatheringState, this.toString());
        };
        this.connection.oniceconnectionstatechange = () => {
            var _a;
            this.log.log('ICE connection state changed:', (_a = this.connection) === null || _a === void 0 ? void 0 : _a.iceConnectionState, this.toString());
        };
        this.connection.onconnectionstatechange = () => {
            var _a;
            this.log.log('Connection state changed:', (_a = this.connection) === null || _a === void 0 ? void 0 : _a.connectionState, this.toString());
        };
        this.connection.onsignalingstatechange = () => {
            var _a;
            this.log.log('Signaling state changed:', (_a = this.connection) === null || _a === void 0 ? void 0 : _a.signalingState, this.toString());
        };
        this.connection.onicecandidate = (event) => {
            var _a;
            this.log.log('onicecandidate event:', event.candidate ? 'candidate available' : 'null candidate', this.toString());
            if (event.candidate) {
                this.log.log('Sending ICE candidate to host:', hostId, this.toString());
                (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate,
                    targetHost: hostId
                }));
            }
        };
        this.log.log('Creating offer', {}, this.toString());
        this.connection.createOffer()
            .then(offer => {
            var _a;
            this.log.log('Offer created:', offer.type, this.toString());
            return (_a = this.connection) === null || _a === void 0 ? void 0 : _a.setLocalDescription(offer);
        })
            .then(() => {
            var _a, _b;
            this.log.log('Local description set, sending offer to host:', hostId, this.toString());
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                type: 'offer',
                offer: (_b = this.connection) === null || _b === void 0 ? void 0 : _b.localDescription,
                targetHost: hostId
            }));
        });
    }
    handleAnswer(answer) {
        var _a;
        this.log.log('Received answer:', answer.type, this.toString());
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.setRemoteDescription(answer).then(() => {
            var _a;
            this.log.log('Remote description set successfully', {}, this.toString());
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                type: 'foundHost',
                foundId: this.remoteHostWSId
            }));
        }).catch(error => {
            this.log.log('Error setting remote description:', error, this.toString());
        });
    }
    handleCandidate(candidate) {
        var _a;
        this.log.log('Received ICE candidate from remote peer', {}, this.toString());
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.addIceCandidate(candidate).then(() => {
            this.log.log('Added ICE candidate successfully', {}, this.toString());
        }).catch(error => {
            this.log.log('Error adding ICE candidate:', error, this.toString());
        });
    }
}
exports.QvahubLanPeer = QvahubLanPeer;
