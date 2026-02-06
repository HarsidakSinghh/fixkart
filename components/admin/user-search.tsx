"use client";

import { Input } from "@/components/ui/input";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce"; // Run: npm install use-debounce if needed, or use simple timeout

// If you don't want to install 'use-debounce', here is a vanilla JS version:
export default function UserSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <Input
            placeholder="Search by name or email..."
            className="max-w-sm"
            defaultValue={searchParams.get("query")?.toString()}
            onChange={(e) => {
                // Simple debounce: wait 500ms before updating URL
                // In a real app, use a proper debounce library
                const value = e.target.value;
                setTimeout(() => handleSearch(value), 500);
            }}
        />
    );
}