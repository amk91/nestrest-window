// WebSocket message structures for communication with Rust backend

export enum WsMessageKind {
    Init = "Init",
    AddDevice = "AddDevice",
    UpdateDevice = "UpdateDevice",
    RemoveDevice = "RemoveDevice"
}

export interface WsMessage<T = any> {
    kind: WsMessageKind;
    payload: T;
}

// Payload types for different message kinds
export interface InitPayload {
    device_count: number;
    devices?: DevicePayload[]; // Optional array of existing devices
    // Add other init-specific fields as needed
}

export interface DevicePayload {
    kind: string
    ip: string;
    status: string;
}

// Type-safe message interfaces for each message kind
export interface InitMessage extends WsMessage<InitPayload> {
    kind: WsMessageKind.Init;
    payload: InitPayload;
}

export interface AddDeviceMessage extends WsMessage<DevicePayload> {
    kind: WsMessageKind.AddDevice;
    payload: DevicePayload;
}

export interface UpdateDeviceMessage extends WsMessage<DevicePayload> {
    kind: WsMessageKind.UpdateDevice;
    payload: DevicePayload;
}

export interface RemoveDeviceMessage extends WsMessage<DevicePayload> {
    kind: WsMessageKind.RemoveDevice;
    payload: DevicePayload;
}

// Union type for all possible messages
export type AnyWsMessage = InitMessage | AddDeviceMessage | UpdateDeviceMessage | RemoveDeviceMessage;

// Type guard functions to safely check message types
export function isInitMessage(message: WsMessage): message is InitMessage {
    return message.kind === WsMessageKind.Init;
}

export function isAddDeviceMessage(message: WsMessage): message is AddDeviceMessage {
    return message.kind === WsMessageKind.AddDevice;
}

export function isUpdateDeviceMessage(message: WsMessage): message is UpdateDeviceMessage {
    return message.kind === WsMessageKind.UpdateDevice;
}

export function isRemoveDeviceMessage(message: WsMessage): message is RemoveDeviceMessage {
    return message.kind === WsMessageKind.RemoveDevice;
}

// Helper function to parse incoming WebSocket messages
export function parseWsMessage(data: string): WsMessage | null {
    try {
        const parsed = JSON.parse(data);
        
        // Basic validation
        if (typeof parsed === 'object' && 
            parsed !== null && 
            'kind' in parsed && 
            'payload' in parsed &&
            Object.values(WsMessageKind).includes(parsed.kind)) {
            return parsed as WsMessage;
        }
        
        console.warn('Invalid message format:', parsed);
        return null;
    } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        return null;
    }
}