"use client";

import { useState } from "react";
import { toggleUserBan } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/confirm-dialog";

export default function UserActions({ userId, isBanned }: { userId: string, isBanned: boolean }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        // If they are banned, we want to unban (false). If active, we want to ban (true).
        const result = await toggleUserBan(userId, !isBanned);
        setIsLoading(false);

        if (!result.success) {
            alert("Action failed. Please try again.");
        }
    };

    if (isBanned) {
        return (
            <ConfirmDialog
                title="Activate User?"
                description="This user will be allowed to log in again."
                toastTitle="User Activated"
                toastDescription="Access restored."
                onConfirm={handleToggle}
                trigger={
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" disabled={isLoading}>
                        Activate
                    </Button>
                }
            />
        );
    }

    return (
        <ConfirmDialog
            title="Suspend User?"
            description="This user will be blocked from logging into the website immediately."
            toastTitle="User Suspended"
            toastDescription="User has been banned."
            variant="destructive"
            onConfirm={handleToggle}
            trigger={
                <Button size="sm" variant="destructive" disabled={isLoading}>
                    Suspend
                </Button>
            }
        />
    );
}