import {notify} from "../utils/notifications";

export function notifyError() {
    return notify({
        message: "Error",
        description: "Something went wrong. Make sure you have enough SOL. Reach out to @crispheaney on twitter",
        type: "error"
    });
}