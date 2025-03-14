

export enum QvaHubLanClientType {
    QvAACAM = 'QvAACAM',
    QvABroVi = 'QvABroVi',
    MyLoReFIO = 'MyLoReFIO',
    QvAVIHUB = 'QvAVIHUB'
}

export enum QvaHubLanWebRTCType {
    BROADCAST = 'broadcast',         // One-to-many streaming (like video hub)
    HOST = 'host',                        // Multiple P2P connections (like FIO)
    PEER = 'peer'                         // Single connection peer
}

export interface QvaHubLanWebRTCClient {
    webRTCType: QvaHubLanWebRTCType;
    clientType: QvaHubLanClientType;
    allowedPeers: QvaHubLanClientType[];
}
