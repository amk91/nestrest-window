// UI management classes for camera display

import { CameraCommand, CameraInfo, CameraStatus } from './camera.js';
import { WsMessageKind } from './messages.js';

export class CameraGridUI {
    private gridContainer: HTMLElement;
    private cardTemplate: HTMLTemplateElement;

    constructor() {
        this.gridContainer = document.getElementById('camerasGrid') as HTMLElement;
        this.cardTemplate = document.getElementById('cameraCardTemplate') as HTMLTemplateElement;
        
        if (!this.gridContainer) {
            console.error('Camera grid container not found');
        }
        if (!this.cardTemplate) {
            console.error('Camera card template not found');
        }
    }

    public addCamera(camera: CameraInfo): void {
        if (!this.gridContainer || !this.cardTemplate) return;

        // Check if camera card already exists
        const existingCard = document.querySelector(`[data-camera-id="${camera.ip}"]`);
        if (existingCard) {
            console.log(`Camera card for ${camera.ip} already exists`);
            return;
        }

        // Clone the template
        const cardClone = this.cardTemplate.content.cloneNode(true) as DocumentFragment;
        const cardElement = cardClone.querySelector('.camera-card') as HTMLElement;
        
        // Set camera ID
        cardElement.setAttribute('data-camera-id', camera.ip);
        cardElement.setAttribute('data-camera-state', camera.status);
        
        // Populate camera information
        const cameraName = cardElement.querySelector('.camera-name') as HTMLElement;
        const cameraLocation = cardElement.querySelector('.camera-location') as HTMLElement;
        const ipAddress = cardElement.querySelector('.ip-address') as HTMLElement;
        const lastUpdate = cardElement.querySelector('.last-update') as HTMLElement;
        const statusElement = cardElement.querySelector('.camera-status') as HTMLElement;
        const statusSpan = statusElement.querySelector('span') as HTMLElement;
        const videoPlaceholder = cardElement.querySelector('.video-placeholder') as HTMLElement;

        if (cameraName) cameraName.textContent = `Camera ${camera.ip}`;
        if (cameraLocation) cameraLocation.textContent = `Location: Unknown`;
        if (ipAddress) ipAddress.textContent = camera.ip;
        if (lastUpdate) lastUpdate.textContent = camera.lastSeen.toLocaleTimeString();
        
        // Update status
        if (statusElement && statusSpan) {
            statusElement.className = 'camera-status status-online';
            statusSpan.textContent = 'Online';
        }

        // Store reference to the image container in camera info
        const videoContainer = cardElement.querySelector('.video-container') as HTMLElement;
        if (videoContainer) {
            // Create img element for displaying frames
            const imgElement = document.createElement('img');
            imgElement.style.width = '100%';
            imgElement.style.height = 'auto';
            imgElement.style.borderRadius = '4px';
            imgElement.style.display = 'block';
            
            // Hide placeholder and show image
            if (videoPlaceholder) videoPlaceholder.style.display = 'none';
            videoContainer.appendChild(imgElement);
            
            // Store reference in camera info
            camera.element = imgElement;
        }

        // Add the card to the grid
        this.gridContainer.appendChild(cardElement);
        // Set up callbacks for on/off and stream on/off buttons
        const powerBtn = cardElement.querySelector('.toggle-power-btn') as HTMLButtonElement;
        if (powerBtn) {
            powerBtn.addEventListener('click', () => {
                const state = cardElement.getAttribute('data-camera-state');
                var command = undefined;
                if (state === CameraStatus.Connected ||
                    state === CameraStatus.Streaming
                ) {
                    command = CameraCommand.Off;
                } else if (state === CameraStatus.Disconnected) {
                    command = CameraCommand.On;
                }

                if (command !== undefined) {
                    powerBtn.disabled = true;
                    setTimeout(() => {
                        powerBtn.disabled = false;
                    }, 2000);
                    sendCameraCommand(camera.ip, command);
                }
            });
        }

        const streamBtn = cardElement.querySelector('.toggle-stream-btn') as HTMLButtonElement;
        if (streamBtn) {
            streamBtn.addEventListener('click', () => {
                const state = cardElement.getAttribute('data-camera-state');
                var command = undefined;
                if (state === CameraStatus.Connected ||
                    state === CameraStatus.Streaming
                ) {
                    command = CameraCommand.StreamOff;
                } else if (state === CameraStatus.Standby) {
                    command = CameraCommand.StreamOn;
                }

                console.log("command: ", command);
                if (command !== undefined) {
                    streamBtn.disabled = true;
                    setTimeout(() => {
                        streamBtn.disabled = false;
                    }, 2000);
                    sendCameraCommand(camera.ip, command);
                }
            });
        }

        function sendCameraCommand(cameraIp: string, command: CameraCommand): void {
            const wsManager = (window as any).wsManager;
            if (!wsManager || typeof wsManager.sendMessage !== 'function') {
                console.error('WebSocket manager not available');
                return;
            }

            const commandMessage = {
                kind: WsMessageKind.CommandDevice,
                payload: {
                    command: command,
                }
            };
            wsManager.sendMessage(commandMessage);
        }
        
        console.log(`Added camera card for ${camera.ip}`);
    }

    public updateCamera(camera: CameraInfo): void {
        const cardElement = document.querySelector(`[data-camera-id="${camera.ip}"]`) as HTMLElement;
        if (!cardElement) return;

        // Update last update time
        const lastUpdate = cardElement.querySelector('.last-update') as HTMLElement;
        if (lastUpdate) {
            lastUpdate.textContent = camera.lastSeen.toLocaleTimeString();
        }

        // Update status
        const statusElement = cardElement.querySelector('.camera-status') as HTMLElement;
        const statusSpan = statusElement?.querySelector('span') as HTMLElement;
        if (statusElement && statusSpan) {
            if (camera.status === 'Connected') {
                statusElement.className = 'camera-status status-online';
                statusSpan.textContent = `Online (${camera.frameCount} frames)`;
            } else {
                statusElement.className = 'camera-status status-offline';
                statusSpan.textContent = 'Offline';
            }
        }

        var powerBtn = cardElement.querySelector('.toggle-power-btn') as HTMLButtonElement;
        if (powerBtn) {
            if (camera.status === CameraStatus.Connected ||
                camera.status === CameraStatus.Streaming
            ) {
                powerBtn.setAttribute('data-state', CameraStatus.Connected);
            } else if (camera.status === CameraStatus.Disconnected) {
                powerBtn.setAttribute('data-state', CameraStatus.Disconnected);
            }
        }

        var streamBtn = cardElement.querySelector('.toggle-stream-btn') as HTMLButtonElement;
        if (streamBtn) {
            if (camera.status === CameraStatus.Streaming) {
                streamBtn.setAttribute('data-state', CameraStatus.Streaming);
            } else if (camera.status === CameraStatus.Standby) {
                streamBtn.setAttribute('data-state', CameraStatus.Standby);
            }
        }
    }

    public removeCamera(cameraIp: string): void {
        const cardElement = document.querySelector(`[data-camera-id="${cameraIp}"]`);
        if (cardElement) {
            cardElement.remove();
            console.log(`Removed camera card for ${cameraIp}`);
        }
    }

    public clearAll(): void {
        if (this.gridContainer) {
            this.gridContainer.innerHTML = '';
        }
    }
}