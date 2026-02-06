"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function UnauthorizedPage() {
    const { signOut } = useClerk();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
                <ShieldAlert className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Access Denied
            </h1>

            <p className="mt-4 text-lg text-gray-600 max-w-md">
                You do not have the necessary permissions to view this page. This area is restricted to administrators only.
            </p>

            <div className="mt-8 flex gap-4">
                {/* ACTION: Sign out and go to login page */}
                <Button
                    variant="default"
                    onClick={() => signOut({ redirectUrl: "/sign-in" })}
                >
                    Sign in with a different account
                </Button>

                {/* ACTION: Sign out and go to home page (which will then likely redirect to login cleanly) */}
                <Button
                    variant="outline"
                    onClick={() => signOut({ redirectUrl: "/" })}
                >
                    Return to Home
                </Button>
            </div>
        </div>
    );
}