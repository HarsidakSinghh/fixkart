"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ConfirmDialog({
    trigger,
    title,
    description,
    onConfirm,
    toastTitle,
    toastDescription,
    variant = "default",
}: {
    trigger: React.ReactNode;
    title: string;
    description: string;
    onConfirm: () => void;
    toastTitle: string;
    toastDescription?: string;
    variant?: "default" | "destructive";
}) {
    const handleConfirm = () => {
        onConfirm();

        if (variant === "destructive") {
            toast.error(toastTitle, {
                description: toastDescription,
            });
        } else {
            toast.success(toastTitle, {
                description: toastDescription,
            });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
