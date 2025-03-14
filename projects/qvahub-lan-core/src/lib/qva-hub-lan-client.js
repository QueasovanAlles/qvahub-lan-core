"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QvahubLanClient = void 0;
const rxjs_1 = require("rxjs");
class QvahubLanClient {
    messageEvents() {
        return this.wsMessageSubject.asObservable();
    }
    connectionEvents() {
        return this.wsConnectionSubject.asObservable();
    }
    constructor(log) {
        this.log = log;
        this.ws = null;
        this.logging = false;
        this.id = '';
        this.clientName = '';
        this.clientType = '';
        this.wsMessageSubject = new rxjs_1.Subject();
        this.wsConnectionSubject = new rxjs_1.Subject();
        this.messageHandler = {
            registered: (data) => {
                this.id = data.Id;
                this.connectionStatus.next(Object.assign(Object.assign({}, this.connectionStatus.value), { isConnected: true, clientId: data.Id, clientType: data.clientType }));
            },
            clientConnected: (data) => {
                this.log.log('clientConnected :', data);
                this.wsMessageSubject.next(data);
            },
            clientDisconnected: (data) => {
                this.log.log('clientDisconnected :', data);
                this.wsMessageSubject.next(data);
            },
            clientRegistered: (data) => {
                this.log.log('clientRegistered :', data);
                this.wsMessageSubject.next(data);
            },
            clientDeleted: (data) => {
                this.log.log('clientDeleted :', data);
                this.wsMessageSubject.next(data);
            },
            clientInfo: (data) => {
                this.log.log('clientInfo :', data);
                this.wsMessageSubject.next(data);
            },
            peerSetup: (data) => {
                this.log.log('peerSetup :', data);
                this.wsMessageSubject.next(data);
            }
        };
        this.connectionStatus = new rxjs_1.BehaviorSubject({
            isConnected: false,
            clientId: null,
            clientType: 'unknown',
            clientName: ''
        });
    }
    register(clientType, clientName) {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'register',
                clientType,
                clientName
            }));
        }
    }
    getId() {
        return this.id;
    }
    connect(serverIp, port, clientName, clientType) {
        this.ws = new WebSocket(`ws://${serverIp}:${port}`);
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const handler = this.messageHandler[data.type];
            if (typeof handler === 'function') {
                handler(data);
            }
            else
                this.log.logError(`could not handle incomming WS message ${data.type}`);
        };
        this.ws.onopen = () => {
            this.register(clientType, clientName);
            this.wsConnectionSubject.next({ status: 'open' });
        };
        this.ws.onclose = () => {
            this.wsConnectionSubject.next({ status: 'closed' });
            this.connectionStatus.next(Object.assign(Object.assign({}, this.connectionStatus.value), { isConnected: false }));
        };
    }
    getConnectionStatus() {
        return this.connectionStatus.asObservable();
    }
    send(type, data = {}) {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(Object.assign({ type: type }, data)));
    }
}
exports.QvahubLanClient = QvahubLanClient;
