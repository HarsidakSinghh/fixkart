"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminBreadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/admin">Dashboard</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {segments.slice(1).map((segment, index) => {
                    const href = "/" + segments.slice(0, index + 2).join("/");
                    const label =
                        segment.charAt(0).toUpperCase() + segment.slice(1);

                    return (
                        <BreadcrumbItem key={href}>
                            <BreadcrumbSeparator />
                            {index === segments.length - 2 ? (
                                <BreadcrumbPage>{label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={href}>{label}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
