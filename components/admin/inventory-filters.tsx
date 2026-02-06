"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// 👇 New Interface for Props
interface InventoryFiltersProps {
    vendors: { id: string; name: string }[];
    subCategories: string[]; // Added
}

export function InventoryFilters({ vendors, subCategories }: InventoryFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSub = searchParams.get("subcategory");
    const currentStatus = searchParams.get("status");
    const currentVendor = searchParams.get("vendor"); // 👇 New Param

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("?");
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* 1. Status Filter - REMOVED as page only shows Live products */}


            {/* 2. Sub-Category Filter */}
            <Select
                defaultValue={currentSub || "all"}
                onValueChange={(val) => handleFilterChange("subcategory", val)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sub-category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sub-categories</SelectItem>
                    {subCategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                            {sub}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 3. NEW: Vendor Filter */}
            <Select
                defaultValue={currentVendor || "all"}
                onValueChange={(val) => handleFilterChange("vendor", val)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                            {v.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {(currentSub || currentVendor) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}