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
    isRemoveDeviceMessage
} from './messages.js';

import { CameraInfo, CameraCatalog } from './camera.js';
import { CameraGridUI } from './ui.js';

class WebSocketManager {
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
        console.log('Attempting to connect to WebSocket...');

        this.socket = new WebSocket(WS_URL);

        // Connection opened
        this.socket.addEventListener('open', (event: Event) => {
            console.log('WebSocket connection established');
            // Update connection status in UI
            const statusIndicator = document.getElementById('connectionIndicator');
            const statusText = document.getElementById('connectionStatus');
            if (statusIndicator) statusIndicator.classList.add('connected');
            if (statusText) statusText.textContent = 'Connected';
        });

        // Listen for messages from the server
        this.socket.addEventListener('message', (event: MessageEvent) => {
            // Check if we received binary data (image)
            if (event.data instanceof ArrayBuffer) {
                this.handleBinaryMessage(event.data);
            } else if (event.data instanceof Blob) {
                // Convert Blob to ArrayBuffer
                event.data.arrayBuffer().then(arrayBuffer => {
                    this.handleBinaryMessage(arrayBuffer);
                });
            } else if (typeof event.data === 'string') {
                this.handleTextMessage(event.data);
            } else {
                console.log('Unknown data type received:', event.data);
            }
        });

        // Connection closed
        this.socket.addEventListener('close', (event: CloseEvent) => {
            console.log('WebSocket connection closed');
        });

        // Error handling
        this.socket.addEventListener('error', (event: Event) => {
            console.error('WebSocket error:', event);
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
        console.log('Received text message:', data);
        
        const message = parseWsMessage(data);
        if (!message) {
            console.warn('Failed to parse message, ignoring');
            return;
        }

        this.handleStructuredMessage(message);
    }

    private handleStructuredMessage(message: WsMessage): void {
        console.log(`Handling ${message.kind} message:`, message.payload);

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
        console.log('Handling init message:', message);
        
        const deviceCount = message.payload?.device_count || 0;
        const existingDevices = message.payload?.devices || [];
        
        console.log(`Initializing with ${deviceCount} devices`);
        
        if (deviceCount === 0) {
            console.log('No devices currently connected');
        } else {
            console.log('Processing existing devices:', existingDevices);
        }

        // Clear existing cameras if reinitializing
        // this.cameraCatalog.clearAll(); // You might want to add this method to CameraCatalog
        
        // Initialize cameras for any existing devices
        existingDevices.forEach((device: any) => {
            if (device.ip) {
                console.log(`Initializing existing device: ${device.ip}`);
                this.cameraCatalog.addCamera(device.ip);
            }
        });
    }

    private handleAddDeviceMessage(message: any): void {
        console.log('Handling add device message:', message.payload);
        
        const ip = message.payload.ip;
        if (typeof ip !== 'string') {
            console.error('Invalid IP in add device message:', ip);
            return;
        }
        
        // Add the camera to the catalog
        this.cameraCatalog.addCamera(ip);
        console.log(`Device added: ${ip}`);
    }

    private handleUpdateDeviceMessage(message: any): void {
        console.log('Handling update device message:', message.payload);
        // TODO: Implement update device message handling
    }

    private handleRemoveDeviceMessage(message: any): void {
        console.log('Handling remove device message:', message.payload);
        
        const ip = message.payload.ip;
        if (typeof ip !== 'string') {
            console.error('Invalid IP in remove device message:', ip);
            return;
        }
        
        // Remove the camera from the catalog
        this.cameraCatalog.removeCamera(ip);
        console.log(`Device removed: ${ip}`);
    }

    private displayImage(imageData: ArrayBuffer, camera: CameraInfo): void {
        // Convert ArrayBuffer to Blob
        const blob = new Blob([imageData], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        // The camera element should already be created by the grid UI
        if (!camera.element) {
            console.warn(`Camera element not found for ${camera.ip}, waiting for grid UI to create it`);
            return;
        }
        
        console.log(`Updating image for camera ${camera.ip} (Frame #${camera.frameCount})`);
        
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