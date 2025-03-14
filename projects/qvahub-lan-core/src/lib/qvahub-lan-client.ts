import { EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { QvaLoggerService} from './qva-logger.service';

export interface ConnectionStatus {
    isConnected: boolean;
    clientId: string | null;
    clientType: string;
    clientName: string;
}

export interface WSClient {
    id: string;
    type: string;
    name: string;
    lastActivity: number;
    lastMessage: string;
    isConnected?: boolean;
	isPeer? : boolean;
    p2pRole?: 'host' | 'remote';
    p2pActionType?: string;
}

interface MessageHandlers {
    [key: string]: ((data: any) => void) | QvahubLanClient;
}

export class QvahubLanClient {

    private ws: WebSocket | null = null;
	private logging : boolean = false;
    private id : string = '';
	private clientName : string = '';
    private clientType : string = '';

    private wsMessageSubject = new Subject<any>();
	messageEvents(): Observable<any> {
        return this.wsMessageSubject.asObservable();
    }

	private wsConnectionSubject = new Subject<any>();
	connectionEvents(): Observable<any> {
        return this.wsConnectionSubject.asObservable();
    }



	private constructor(private log : QvaLoggerService) {
	}

    private messageHandler: MessageHandlers = {
        registered: (data: any) => {
            this.id = data.Id;
            this.connectionStatus.next({
                ...this.connectionStatus.value,
                isConnected: true,
                clientId: data.Id,
                clientType: data.clientType
            });
        },
		clientConnected: (data: any) => {
            this.log.log('clientConnected :', data);
            this.wsMessageSubject.next(data);
        },
		clientDisconnected: (data: any) => {
            this.log.log('clientDisconnected :', data);
            this.wsMessageSubject.next(data);
        },
        clientRegistered: (data: any) => {
            this.log.log('clientRegistered :', data);
            this.wsMessageSubject.next(data);
        },
        clientDeleted: (data: any) => {
            this.log.log('clientDeleted :', data);
            this.wsMessageSubject.next(data);
        },
		clientInfo: (data: any) => {
            this.log.log('clientInfo :', data);
            this.wsMessageSubject.next(data);
        },
		peerSetup: (data: any) => {
            this.log.log('peerSetup :', data);
            this.wsMessageSubject.next(data);
        }
    };



    private connectionStatus = new BehaviorSubject<ConnectionStatus>({
		isConnected: false,
		clientId: null,
		clientType: 'unknown',
		clientName: ''
	});

	private register(clientType: string, clientName: string) {
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

    connect(serverIp: string, port: number, clientName : string, clientType : string) {
        
		this.ws = new WebSocket(`ws://${serverIp}:${port}`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const handler = this.messageHandler[data.type];
            if (typeof handler === 'function') {
                handler(data);
            } else this.log.logError(`could not handle incomming WS message ${data.type}`);
        };

		this.ws.onopen = () => {
			this.register(clientType, clientName);
			this.wsConnectionSubject.next({status: 'open'});
		};
		
		this.ws.onclose = () => {
            this.wsConnectionSubject.next({status: 'closed'});
			this.connectionStatus.next({
				...this.connectionStatus.value,
				isConnected: false
			});
		};

    }

	getConnectionStatus(): Observable<ConnectionStatus> {
		return this.connectionStatus.asObservable();
	}

	send(type: string, data: any = {}) {
		this.ws?.send(JSON.stringify({
			type: type,
			...data
		}));
	}

    

}