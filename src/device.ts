import { z } from "zod";

export enum DeviceType {
    Camera = "Camera",
}

export enum DeviceStatus {
    Disconnected = 'DISCONNECTED',
    Connected = 'CONNECTED',
    Streaming = 'STREAMING',
    LowBattery = 'LOW_BATTERY',
    HighTemp = 'HIGH_TEMP',
}

export enum DeviceCommand {
    RestartDevice = "RestartDevice",
    StopStream = "StopStream",
    StartStream = "StartStream",
    StreamOnMotionDetected = "StreamOnMotionDetected",
    TurnLedOn = "TurnLedOn",
    TurnLedOff = "TurnLedOff",
}

export const DeviceInfoSchema = z.object({
    name: z.string(),
    kind: z.enum(DeviceType),
    ip: z.ipv4(),
    status: z.string(),
    fps: z.number(),
});
export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

export class Device {
    name: string;
    kind: DeviceType;
    ip: string;
    status: DeviceStatus[];
    fps: number;

    constructor(name: string, kind: DeviceType, ip: string, status: string, fps: number = 0) {
        this.name = name;
        this.kind = kind;
        this.ip = ip;
        this.status = Device.statusFromString(status)
        this.fps = fps;
    }

    public static statusFromString(status: string): DeviceStatus[] {
        return status
            .split('|')
            .map(s => s.trim())
            .filter(s => Object.values(DeviceStatus).includes(s as DeviceStatus)) as DeviceStatus[];
    }

    public static fromDeviceInfo(deviceInfo: DeviceInfo): Device {
        return new Device(deviceInfo.name, deviceInfo.kind, deviceInfo.ip, deviceInfo.status, deviceInfo.fps);
    }

    public updateFromDeviceInfo(deviceInfo: DeviceInfo) {
        this.status = Device.statusFromString(deviceInfo.status);
        this.fps = deviceInfo.fps;
    }

    public toDeviceInfo(): DeviceInfo {
        return {
            name: this.name,
            kind: this.kind,
            ip: this.ip,
            status: this.status.join(' | '),
            fps: this.fps,
        }
    }
}
