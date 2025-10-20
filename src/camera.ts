// Camera management interfaces and classes

export interface CameraInfo {
    ip: string;
    lastSeen: Date;
    status: 'Disconnected' | 'Connected' | 'Standby' | 'Error';
    element: HTMLImageElement | null;
    label: HTMLElement | null;
    frameCount: number;
}

export class CameraCatalog {
    private cameras: Map<string, CameraInfo> = new Map();
    private inactivityTimeout: number = 30000; // 30 seconds
    private onCameraAddedCallback: ((camera: CameraInfo) => void) | null = null;
    private onCameraUpdatedCallback: ((camera: CameraInfo) => void) | null = null;

    public addOrUpdateCamera(ip: string): CameraInfo {
        let camera = this.cameras.get(ip);
        let isNewCamera = false;

        if (!camera) {
            // New camera discovered
            camera = {
                ip,
                lastSeen: new Date(),
                status: 'Connected',
                element: null,
                label: null,
                frameCount: 0
            };
            this.cameras.set(ip, camera);
            console.log(`New camera discovered: ${ip}`);
            isNewCamera = true;
        } else {
            // Update existing camera
            camera.lastSeen = new Date();
            camera.status = 'Connected';
        }
        
        camera.frameCount++;
        
        // Trigger callbacks
        if (isNewCamera && this.onCameraAddedCallback) {
            this.onCameraAddedCallback(camera);
        } else if (!isNewCamera && this.onCameraUpdatedCallback) {
            this.onCameraUpdatedCallback(camera);
        }
        
        return camera;
    }

    public addCamera(ip: string): CameraInfo {
        if (this.cameras.has(ip)) {
            console.log(`Camera ${ip} already exists`);
            return this.cameras.get(ip)!;
        }

        const camera: CameraInfo = {
            ip,
            lastSeen: new Date(),
            status: 'Connected',
            element: null,
            label: null,
            frameCount: 0
        };
        
        this.cameras.set(ip, camera);
        console.log(`Camera added: ${ip}`);
        
        // Trigger callback
        if (this.onCameraAddedCallback) {
            this.onCameraAddedCallback(camera);
        }
        
        return camera;
    }

    public updateCameraFrame(ip: string): CameraInfo | null {
        const camera = this.cameras.get(ip);
        if (!camera) {
            return null; // Camera not found
        }
        
        // Update camera info
    camera.lastSeen = new Date();
    camera.status = 'Connected';
    camera.frameCount++;
        
        // Trigger callback
        if (this.onCameraUpdatedCallback) {
            this.onCameraUpdatedCallback(camera);
        }
        
        return camera;
    }

    public hasCamera(ip: string): boolean {
        return this.cameras.has(ip);
    }

    public getCamera(ip: string): CameraInfo | undefined {
        return this.cameras.get(ip);
    }

    public getAllCameras(): CameraInfo[] {
        return Array.from(this.cameras.values());
    }

    public getActiveCameras(): CameraInfo[] {
    return this.getAllCameras().filter(camera => camera.status === 'Connected');
    }

    public markInactive(ip: string): void {
        const camera = this.cameras.get(ip);
        if (camera) {
            camera.status = 'Disconnected';
            console.log(`Camera marked as inactive: ${ip}`);
        }
    }

    public removeCamera(ip: string): void {
        const camera = this.cameras.get(ip);
        if (camera) {
            // Clean up DOM elements
            if (camera.element) {
                camera.element.remove();
            }
            if (camera.label) {
                camera.label.remove();
            }
            this.cameras.delete(ip);
            console.log(`Camera removed: ${ip}`);
        }
    }

    public startInactivityMonitoring(): void {
        setInterval(() => {
            const now = new Date();
            this.cameras.forEach((camera, ip) => {
                const timeSinceLastSeen = now.getTime() - camera.lastSeen.getTime();
                if (timeSinceLastSeen > this.inactivityTimeout && camera.status === 'Connected') {
                    this.markInactive(ip);
                }
            });
        }, 5000); // Check every 5 seconds
    }

    public getCameraCount(): number {
        return this.cameras.size;
    }

    public getActiveCameraCount(): number {
        return this.getActiveCameras().length;
    }

    public onCameraAdded(callback: (camera: CameraInfo) => void): void {
        this.onCameraAddedCallback = callback;
    }

    public onCameraUpdated(callback: (camera: CameraInfo) => void): void {
        this.onCameraUpdatedCallback = callback;
    }

    public clearAll(): void {
        // Clean up DOM elements for all cameras
        this.cameras.forEach((camera, ip) => {
            if (camera.element) {
                camera.element.remove();
            }
            if (camera.label) {
                camera.label.remove();
            }
        });
        
        // Clear the map
        this.cameras.clear();
        console.log('All cameras cleared');
    }
}