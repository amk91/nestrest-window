import { Device, DeviceInfo, DeviceCommand, DeviceType } from "./device";
import { Message, MessageKind, parseMessage } from "./message";
import { UiManager } from "./ui/ui_manager";

const WS_URL = "ws://127.0.0.1:8081/web-ws";

export class App {
    private socket: WebSocket | null = null;
    private devices: Device[] = [];
    private uiManager: UiManager;

    constructor() {
        this.uiManager = new UiManager();

        this.connect();
    }

    public sendCommandToDevice(device: Device, command: DeviceCommand) {
        const message: Message = {
            kind: MessageKind.CommandDevice,
            payload: {
                device: device.toDeviceInfo(),
                command: command,
            }
        };

        console.log(message);

        this.socket?.send(JSON.stringify(message));
    }

    private connect(): void {
        this.socket = new WebSocket(WS_URL);

        this.socket.addEventListener('open', (event: Event) => {
            console.log("Connection opened");
        });

        this.socket.addEventListener('message', (event: MessageEvent) => {
            if (typeof event.data === 'string') {
                this.handleJsonMessage(event.data);
            } else if (typeof event.data === 'object') {
                this.handleBinaryMessage(event.data);
            }
        });

        this.socket.addEventListener('error', (event: Event) => {
            console.log("Error on ws connection", event);
        });
    }

    private handleJsonMessage(data: string): void {
        const message = parseMessage(data);
        if (message === null) {
            console.error('Unable to parse received message', data);
            return;
        }

        switch (message.kind) {
            case MessageKind.InitDevices:
                this.initDevicesCollection(message.payload as DeviceInfo[]);
            break;
            case MessageKind.AddDevice:
                this.addDevice(message.payload as DeviceInfo);
            break;
            case MessageKind.UpdateDevices:
                this.updateDevices(message.payload as DeviceInfo[]);
            break;
            case MessageKind.RemoveDevice:
                this.removeDevice(message.payload as DeviceInfo);
            break;
        }
    }

    private handleBinaryMessage(data: Blob): void {
        this.uiManager.updateCameraFrame(data);
    }

    private initDevicesCollection(devices: DeviceInfo[]) {
        console.log(devices);
        devices.forEach((device) => {
            this.devices.push(Device.fromDeviceInfo(device));
        });

        console.log("Total number of devices available:", this.devices.length);
        this.uiManager.initCameras(this.devices.filter((value) => value.kind === DeviceType.Camera));
    }

    private addDevice(device: DeviceInfo) {
        console.log("Add device message received", device);
        var deviceFound = this.devices.find((value) => value.ip === device.ip)
        if (deviceFound) {
            this.updateDevice(device);
            console.log(`Device ${deviceFound} already in collection`);
        } else {
            const newDevice = Device.fromDeviceInfo(device);
            this.devices.push(newDevice);
            this.uiManager.addCamera(newDevice);

            console.log(
                `Device ${newDevice} added, ` +
                `ui camera collection ${this.uiManager.camerasCollection.length}, ` +
                `ui camera grid ${this.uiManager.camerasGrid?.children.length}`)
        }
    }

    private updateDevice(device: DeviceInfo) {
        console.log("Update device message received", device);
        var deviceFound = this.devices.find((value) => value.ip === device.ip);
        if (deviceFound) {
            this.uiManager.updateCamera(deviceFound);
        } else {
            console.warn('Unable to find device with ip ' + device.ip + ', adding it to the collection');
            this.addDevice(device);
        }
    }

    private updateDevices(devices: DeviceInfo[]) {
        devices.forEach((device) => {
            var deviceFound = this.devices.find((value) => value.ip === device.ip);
            if (deviceFound) {
                deviceFound.updateFromDeviceInfo(device);
                this.uiManager.updateCamera(deviceFound);
            }
        })
    }

    private removeDevice(device: DeviceInfo) {
        console.log("Remove devices message received", device);
        var deviceFound = this.devices.find((value) => value.ip === device.ip);
        if (deviceFound) {
            this.uiManager.removeCamera(device.ip);
        }
    }
}
