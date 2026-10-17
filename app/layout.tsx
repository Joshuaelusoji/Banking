
import type { Metadata } from "next";
import { Open_Sans, Inter, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    variable: "--font-open-sans",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const ibmPlexSerif = IBM_Plex_Serif({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-ibm-plex-serif",
});

export const metadata: Metadata = {
    title: "Mercury",
    description:
        "Modern banking for the modern world. Mercury is a financial technology company that provides banking services to startups and small businesses.",
    icons: {
        icon: "/icons/logo.svg",
    },
};

type LayoutProps = {
    children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
    return (
        <html
            lang="en"
            className={cn(
                "h-full",
                "antialiased",
                openSans.className,
                openSans.variable,
                inter.variable
            )}
        >
        <body className={ibmPlexSerif.variable}>{children}</body>
        </html>
    );
}
