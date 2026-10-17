
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const loggedIn = await getLoggedInUser();

    return (
        <main className="flex h-screen w-full font-inter">
            {loggedIn && <Sidebar user={loggedIn} />}
            {children}
        </main>
    );
}
