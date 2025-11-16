import { z } from "zod";
import { DeviceInfoSchema } from "./device";

export enum MessageKind {
    InitDevices = "InitDevices",
    AddDevice = "AddDevice",
    UpdateDevice = "UpdateDevice",
    UpdateDevices = "UpdateDevices",
    RemoveDevice = "RemoveDevice",
    CommandDevice = "CommandDevice",
}

const MessageSchema = z.object({
    kind: z.enum(MessageKind),
    payload: z.union([
        DeviceInfoSchema,
        z.array(DeviceInfoSchema),
        z.object({
            device: DeviceInfoSchema,
            command: z.string()
        })
    ]),
});
export type Message = z.infer<typeof MessageSchema>;

export function parseMessage(data: string): Message | null {
    try {
        const parsedMessage = JSON.parse(data);
        const result = z.safeParse(MessageSchema, parsedMessage);

        if (result.error) {
            console.error(result.error);
        }

        return result.success ? result.data : null;
    } catch (error) {
        console.log("In parseMessage, unable to parse data:", error);
        return null;
    }
}
