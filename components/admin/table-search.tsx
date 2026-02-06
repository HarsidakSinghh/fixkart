"use client";

import { Input } from "@/components/ui/input";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function TableSearch({ placeholder = "Search..." }: { placeholder?: string }) {
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
        // Update URL without refreshing the page
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="pl-9 w-full"
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => {
                    // Simple debounce to prevent too many DB calls while typing
                    const value = e.target.value;
                    setTimeout(() => handleSearch(value), 500);
                }}
            />
        </div>
    );
}