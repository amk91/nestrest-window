// WebSocket URL for the backend
const WS_URL = "ws://127.0.0.1:8081/web-ws";

import { 
    WsMessage, 
    WsMessageKind, 
    AnyWsMessage,
    parseWsMessage,
    isInitMessage,
    isAddDeviceMessage,
    isUpdateDeviceMessage,
    isRemoveDeviceMessage,
    UpdateDeviceMessage
} from './messages.js';

import { CameraInfo, CameraCatalog } from './camera.js';
import { CameraGridUI } from './ui.js';

class WebSocketManager {
    private reconnectTimeout: number | null = null;
    private reconnectDelay: number = 3000; // ms
    private socket: WebSocket | null = null;
    private cameraCatalog: CameraCatalog;
    private gridUI: CameraGridUI;

    constructor() {
        this.cameraCatalog = new CameraCatalog();
        this.gridUI = new CameraGridUI();
        
        // Set up catalog callbacks to update UI
        this.cameraCatalog.onCameraAdded((camera: CameraInfo) => {
            this.gridUI.addCamera(camera);
        });
        
        this.cameraCatalog.onCameraUpdated((camera: CameraInfo) => {
            this.gridUI.updateCamera(camera);
        });
        
        this.cameraCatalog.startInactivityMonitoring();
        this.connect();
    }

    private connect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        // UI: set status to connecting
        const statusIndicator = document.getElementById('connectionIndicator');
        const statusText = document.getElementById('connectionStatus');
        if (statusIndicator) statusIndicator.classList.remove('connected');
        if (statusText) statusText.textContent = 'Connecting...';

        this.socket = new WebSocket(WS_URL);

        this.socket.addEventListener('open', (event: Event) => {
            // UI: set status to connected
            const statusIndicator = document.getElementById('connectionIndicator');
            const statusText = document.getElementById('connectionStatus');
            if (statusIndicator) statusIndicator.classList.add('connected');
            if (statusText) statusText.textContent = 'Connected';
            // Clear all cameras and UI state on reconnect
            if (typeof this.cameraCatalog.clearAll === 'function') {
                this.cameraCatalog.clearAll();
            }
            if (typeof this.gridUI.clearAll === 'function') {
                this.gridUI.clearAll();
            }
        });

        this.socket.addEventListener('message', (event: MessageEvent) => {
            if (!(event.data instanceof ArrayBuffer) && !(event.data instanceof Blob) && typeof event.data !== 'string') {
                console.log('Unknown data type received:', event.data);
            }
            if (event.data instanceof ArrayBuffer) {
                this.handleBinaryMessage(event.data);
            } else if (event.data instanceof Blob) {
                event.data.arrayBuffer().then(arrayBuffer => {
                    this.handleBinaryMessage(arrayBuffer);
                });
            } else if (typeof event.data === 'string') {
                this.handleTextMessage(event.data);
            }
        });

        this.socket.addEventListener('close', (event: CloseEvent) => {
            // UI: set status to disconnected
            const statusIndicator = document.getElementById('connectionIndicator');
            const statusText = document.getElementById('connectionStatus');
            if (statusIndicator) statusIndicator.classList.remove('connected');
            if (statusText) statusText.textContent = 'Disconnected';
            // Try to reconnect after delay
            if (!this.reconnectTimeout) {
                this.reconnectTimeout = window.setTimeout(() => {
                    this.connect();
                }, this.reconnectDelay);
            }
        });

        this.socket.addEventListener('error', (event: Event) => {
            console.error('WebSocket error:', event);
            // Optionally close to trigger reconnect
            if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
                this.socket.close();
            }
        });
    }

    private handleBinaryMessage(data: ArrayBuffer): void {
        const view = new Uint8Array(data);
        const ip = `${view[0]}.${view[1]}.${view[2]}.${view[3]}`;
        const imageData = data.slice(4);

        // Check if we have this camera registered
        if (!this.cameraCatalog.hasCamera(ip)) {
            console.error(`Received frame from unknown camera IP: ${ip}. Dropping frame.`);
            return;
        }

        // Update camera frame count and last seen
        const camera = this.cameraCatalog.updateCameraFrame(ip);
        if (!camera) {
            console.error(`Failed to update camera ${ip}. This should not happen.`);
            return;
        }

        this.displayImage(imageData, camera);
    }

    private handleTextMessage(data: string): void {
        const message = parseWsMessage(data);
        if (!message) {
            console.warn('Failed to parse message, ignoring');
            return;
        }

        this.handleStructuredMessage(message);
    }

    private handleStructuredMessage(message: WsMessage): void {
        if (isInitMessage(message)) {
            this.handleInitMessage(message);
        } else if (isAddDeviceMessage(message)) {
            this.handleAddDeviceMessage(message);
        } else if (isUpdateDeviceMessage(message)) {
            this.handleUpdateDeviceMessage(message);
        } else if (isRemoveDeviceMessage(message)) {
            this.handleRemoveDeviceMessage(message);
        } else {
            console.warn('Unknown message kind:', message.kind);
        }
    }

    private handleInitMessage(message: any): void {
        let devices: any[] = [];
        // Support both array and object payloads
        if (Array.isArray(message.payload)) {
            devices = message.payload;
        } else if (message.payload && Array.isArray(message.payload.devices)) {
            devices = message.payload.devices;
        }
        const deviceCount = devices.length;
        // Initialize cameras for any existing devices
        devices.forEach((device: any) => {
            if (device.ip) {
                this.cameraCatalog.addCamera(device.ip);
            }
        });
    }

    private handleAddDeviceMessage(message: any): void {
        const ip = message.payload.ip;
        if (typeof ip !== 'string') {
            console.error('Invalid IP in add device message:', ip);
            return;
        }
        
        // Add the camera to the catalog
        this.cameraCatalog.addCamera(ip);
    }

    private handleUpdateDeviceMessage(message: UpdateDeviceMessage): void {
        this.cameraCatalog.updateCamera(message.payload);
    }

    private handleRemoveDeviceMessage(message: any): void {
        const ip = message.payload.ip;
        if (typeof ip !== 'string') {
            console.error('Invalid IP in remove device message:', ip);
            return;
        }
        
        // Remove the camera from the catalog
        this.cameraCatalog.removeCamera(ip);
    }

    private displayImage(imageData: ArrayBuffer, camera: CameraInfo): void {
        // Convert ArrayBuffer to Blob
        const blob = new Blob([imageData], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        // The camera element should already be created by the grid UI
        if (!camera.element) {
            return;
        }
        // Clean up previous URL to prevent memory leaks
        if (camera.element.src && camera.element.src.startsWith('blob:')) {
            URL.revokeObjectURL(camera.element.src);
        }
        // Set new image
        camera.element.src = imageUrl;
        camera.element.onerror = (e) => {
            console.error(`Image from ${camera.ip} failed to load:`, e);
        };
    }

    public sendMessage(data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
            console.log('Sent message:', data);
        } else {
            console.error('WebSocket is not open');
        }
    }

    public getCameraCatalog(): CameraCatalog {
        return this.cameraCatalog;
    }

    public getGridUI(): CameraGridUI {
        return this.gridUI;
    }
}

// Function to initialize WebSocket and global functions
function initializeApp() {
    console.log('Initializing WebSocket connection...');
    const wsManager = new WebSocketManager();

    (window as any).wsManager = wsManager;
    (window as any).sendText = (message: string) => {
        if (typeof message !== 'string') {
            console.error('message must be a string');
            return;
        }
        wsManager.sendMessage(message);
    };

    // Debug functions for camera catalog and grid UI
    (window as any).getCameras = () => {
        const catalog = wsManager.getCameraCatalog();
        console.log('All cameras:', catalog.getAllCameras());
        console.log('Active cameras:', catalog.getActiveCameras());
        console.log(`Total: ${catalog.getCameraCount()}, Active: ${catalog.getActiveCameraCount()}`);
        return catalog.getAllCameras();
    };
    
    (window as any).getCameraStats = () => {
        const catalog = wsManager.getCameraCatalog();
        return {
            total: catalog.getCameraCount(),
            active: catalog.getActiveCameraCount(),
            cameras: catalog.getAllCameras().map(cam => ({
                ip: cam.ip,
                frameCount: cam.frameCount,
                status: cam.status,
                lastSeen: cam.lastSeen.toLocaleTimeString()
            }))
        };
    };

    (window as any).gridUI = wsManager.getGridUI();
}

// Initialize immediately if DOM is already loaded, otherwise wait for it
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Debug: Check DOM state
console.log('Script loaded, document.readyState:', document.readyState);
