import { DeviceCommand, Device, DeviceStatus } from '../device'

export class UiDevice {
    device: Device;
    
    card: HTMLElement | null = null;
    image: HTMLImageElement | null = null;
    fpsSpan: HTMLSpanElement | null = null;
    restartDeviceButton: HTMLButtonElement | null = null;
    startStreamButton: HTMLButtonElement | null = null;
    stopStreamButton: HTMLButtonElement | null = null;
    streamOnMotionDetectedButton: HTMLButtonElement | null = null;
    turnLedOnButton: HTMLButtonElement | null = null;
    turnLedOffButton: HTMLButtonElement | null = null;

    onGrid: boolean = false;
    onScreen: boolean = false;

    constructor(device: Device) {
        this.device = device;

        this.setupCard();
    }

    private setupCard() {
        const template = document.getElementById('device-card-template') as HTMLTemplateElement;
        this.card = (template.content.cloneNode(true) as DocumentFragment).querySelector('.device-card') as HTMLElement;
        this.card.setAttribute('device-ip', this.device.ip);

        this.setupHeader();
        this.setupVideo();
        this.setupFooter();
    }

    private setupHeader() {
        const nameSpan = this.card?.querySelector('.device-name') as HTMLSpanElement;
        if (nameSpan) {
            nameSpan.textContent = this.device.name;
        }

        const statusSpan = this.card?.querySelector('.device-status') as HTMLSpanElement;
        if (statusSpan && this.device.status.length > 0) {
            statusSpan.textContent = this.device.status[0]!.toString();
        }

        this.fpsSpan = this.card?.querySelector('.device-fps-value') as HTMLSpanElement;
        if (this.fpsSpan) {
            this.fpsSpan.textContent = this.device.fps.toString();
        }
    }

    private setupVideo() {
        const videoContainer = this.card?.querySelector('.device-video') as HTMLElement;
        if (!videoContainer) return;

        this.image = document.createElement('img');
        this.image.style.width = '100%';
        this.image.style.height = 'auto';
        this.image.style.borderRadius = '4px';
        this.image.style.display = 'block';
        this.image.onerror = (err) => {
            console.error('Error on img element for camera', this.device.ip);
        };

        videoContainer.appendChild(this.image);
    }

    private setupFooter() {
        this.restartDeviceButton = this.card?.querySelector('.btn-restart') as HTMLButtonElement;
        this.restartDeviceButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.RestartDevice);
        };

        this.stopStreamButton = this.card?.querySelector('.btn-stop-stream') as HTMLButtonElement;
        this.stopStreamButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.StopStream);
        };

        this.startStreamButton = this.card?.querySelector('.btn-start-stream') as HTMLButtonElement;
        this.startStreamButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.StartStream);
        };

        this.streamOnMotionDetectedButton = this.card?.querySelector('.btn-motion-stream') as HTMLButtonElement;
        this.streamOnMotionDetectedButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.StreamOnMotionDetected);
        };

        this.turnLedOnButton = this.card?.querySelector('.btn-turn-led-on') as HTMLButtonElement;
        this.turnLedOnButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.TurnLedOn);
        };

        this.turnLedOffButton = this.card?.querySelector('.btn-turn-led-off') as HTMLButtonElement;
        this.turnLedOffButton.onclick = (_) => {
            (window as any).app.sendCommandToDevice(this.device, DeviceCommand.TurnLedOff);
        };

        this.updateStatus();
    }

    public updateFrame(imageData: Blob) {
        if (!this.image) return;

        const blob = new Blob([imageData], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);

        if (this.image.src && this.image.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.image.src);
        }

        this.image.src = imageUrl;
    }

    public updateStatus() {
    }

    public updateFps() {
        if (this.fpsSpan) {
            this.fpsSpan.textContent = this.device.fps.toString();
        }
    }

    public updateCamera() {
        this.updateStatus();
        this.updateFps();
    }
}
