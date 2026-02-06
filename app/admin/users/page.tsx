import { clerkClient } from "@clerk/nextjs/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UserSearch from "@/components/admin/user-search";
import UserActions from "@/components/admin/user-actions";
export const dynamic = "force-dynamic";
// FIX: params and searchParams are Promises in Next.js 15
export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    // 1. Await the search parameters
    const params = await searchParams;
    const query = params.query || "";

    const client = await clerkClient();

    // 2. Fetch users with the search query
    const response = await client.users.getUserList({
        orderBy: '-created_at',
        limit: 50,
        query: query, // Pass the search term to Clerk
    });

    const users = Array.isArray(response) ? response : response.data;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Registered Users</h1>
                    <span className="text-sm text-muted-foreground">
                        {users.length} results found
                    </span>
                </div>

                {/* Search Bar Component */}
                <UserSearch />
            </div>

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found matching "{query}"
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => {
                                const primaryEmail = user.emailAddresses.find(
                                    (email: any) => email.id === user.primaryEmailAddressId
                                )?.emailAddress;

                                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name";
                                const isBanned = user.banned; // Clerk provides this boolean

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.imageUrl} alt={fullName} />
                                                <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {fullName}
                                            <div className="text-xs text-muted-foreground md:hidden">
                                                {primaryEmail}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{primaryEmail}</TableCell>
                                        <TableCell>
                                            <Badge variant={isBanned ? "destructive" : "outline"} className={!isBanned ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                {isBanned ? "Banned" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Suspend/Activate Button */}
                                            <UserActions userId={user.id} isBanned={isBanned} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}