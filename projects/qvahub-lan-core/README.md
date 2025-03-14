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
client.connect('192.168.1.2', 52330, 'MyClient', 'viewer');
```

## Development

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.0.0.

### Building
Run `ng build qvahub-lan-core` to build the project. The build artifacts will be stored in the `dist/` directory.

### Publishing
After building, run:
```bash
cd dist/qvahub-lan-core
npm publish
```

### Testing
Run `ng test qvahub-lan-core` to execute the unit tests via Karma.

## Community
Join our Google Group: queaso-van-alles@googlegroups.com

## License
MIT License - © 2025 Queaso van Alles