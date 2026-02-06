"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useClerk, UserButton } from "@clerk/nextjs"; // Import Clerk hooks
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

export default function AdminNavbar({ toggleSidebar }: { toggleSidebar: () => void }) {
    const { signOut } = useClerk();
    const router = useRouter();

    return (
        <header className="h-14 bg-blue-600 text-white flex items-center justify-between px-6">
            {/* Left */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-white hover:bg-blue-700">
                    <Menu size={24} />
                </Button>
                <div className="font-semibold text-lg">
                    Fixkart Admin Panel
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                {/* OPTION 1: Clerk's Pre-built User Button (Recommended) 
                    This handles Avatar, Account Management, and Sign Out automatically. 
                    If you use this, you can remove the custom Avatar and Sign Out button below.
                */}
                {/* <UserButton afterSignOutUrl="/sign-in" /> */}

                {/* OPTION 2: Your Custom UI (What you asked for) */}
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white text-blue-600 font-bold">
                        A
                    </AvatarFallback>
                </Avatar>

                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-100"
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                >
                    Sign Out
                </Button>
            </div>
        </header>
    );
}