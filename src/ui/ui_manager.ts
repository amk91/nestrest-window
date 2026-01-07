import { Device } from "../device";
import { UiDevice } from "./device";

export class UiManager {
    camerasCollection: UiDevice[] = [];
    camerasGrid: HTMLElement | null = null;

    constructor() {
        this.camerasGrid = document.getElementById('device-grid') as HTMLElement;
        if (this.camerasGrid === null) {
            console.error('Unable to init UiManager, unable to get #device-grid');
            return;
        }
    }

    public initCameras(cameras: Device[]) {
        cameras.forEach(camera => {
            const cameraUi = new UiDevice(camera);
            if (cameraUi.card) {
                this.camerasGrid?.appendChild(cameraUi.card);
                cameraUi.onGrid = true;
            }

            this.camerasCollection.push(cameraUi);
            console.log("Camera added to grid:", camera);
        });
    }

    public addCamera(camera: Device) {
        const cameraUi = new UiDevice(camera);
        if (cameraUi.card) {
            this.camerasGrid?.appendChild(cameraUi.card);
            cameraUi.onGrid = true;
        }

        this.camerasCollection.push(cameraUi);
    }

    public updateCamera(camera: Device) {
        var cameraFound = this.camerasCollection.find(value => value.device.ip === camera.ip);
        if (cameraFound) {
            cameraFound.device = camera;
            cameraFound.updateCamera();
        }
    }

    public removeCamera(ip: string) {
        const index = this.camerasCollection.findIndex(camera => camera.device.ip === ip);
        if (index === -1) {
            console.warn(`Camera with IP ${ip} not found in collection.`);
            return;
        }

        const cameraUi = this.camerasCollection[index];
        if (cameraUi) {
            if (cameraUi.card && this.camerasGrid?.contains(cameraUi.card)) {
                this.camerasGrid.removeChild(cameraUi.card);
                cameraUi.onGrid = false;
            }

            this.camerasCollection.splice(index, 1);
        }
    }

    public async updateCameraFrame(data: Blob) {
        const buffer = await data.arrayBuffer().then((b) => new Uint8Array(b));
        const ip = `${buffer[0]}.${buffer[1]}.${buffer[2]}.${buffer[3]}`;
        var camera = this.camerasCollection.find((camera) => camera.device.ip === ip);
        if (!camera) {
            console.error('Unable to find camera with ip', ip);
            return;
        }

        camera.updateFrame(data.slice(4))
    }
}
