import { CircleHelp, Bell, LogOut } from "lucide-react";

export const quickActions: QuickAction[] = [
    {
        id: "help",
        name: "help",
        icon: CircleHelp,
        color: "#000000",
        backgroundColor: "#F3F4F6",
    },
    {
        id: "notifications",
        name: "notifications",
        icon: Bell,
        color: "#000000",
        backgroundColor: "#F3F4F6",
    },
    {
        id: "exit",
        name: "sign out",
        icon: LogOut,
        color: "#000000",
        backgroundColor: "#F3F4F6",
    },
];