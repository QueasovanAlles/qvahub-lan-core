# QvAHub LAN Core

Angular library providing client-side WebRTC and WebSocket operations for QvA Hub LAN network communication.

![QvA Hub LAN Core](/docs/qvahublancore.png)

## Features
- WebSocket client management
- WebRTC peer connection handling 
- Connection status monitoring
- Message event system
- Angular service integration

## Installation
```bash
npm install qvahub-lan-core
```

### Dependencies
- @angular/core: ^16.2.0
- rxjs: ~7.8.0

## Usage
```typescript
import { QvahubLanClient } from 'qvahub-lan-core';

// Initialize client
const client = new QvahubLanClient();

// Connect to hub
client.connect('192.168.1.2', 52330, 'clientType', 'clientName');
```

There is a hardcoded preset off clientTypes. The separation of this list is a todo :
in qvahub-lan-types.ts

```typescript
export enum QvaHubLanClientType {
    QvAACAM = 'QvAACAM',
    QvABroVi = 'QvABroVi',
    MyLoReFIO = 'MyLoReFIO',
    QvAVIHUB = 'QvAVIHUB'
}

export enum QvaHubLanWebRTCType {
    BROADCAST = 'broadcast',              // One-to-many streaming - unimplemented yet
    HOST = 'host',                        // Multiple P2P connections (like FIO)
    PEER = 'peer'                         // Single connection peer
}
```

## Development

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.0.0.


## Community
Join our Google Group: queaso-van-alles@googlegroups.com

## License
MIT License - © 2025 Queaso van Alles