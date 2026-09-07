import Sidebar from "@/components/Sidebar";


export default function RootLayout({ children }: LayoutProps<"/">) {

  const loggedIn = { firstname: 'Joshua', lastName: 'Elusoji'}

  return (
    <main className="flex h-screen w-full font-inter">
        <Sidebar user={loggedIn} />
        {children}
    </main>
  );
}
