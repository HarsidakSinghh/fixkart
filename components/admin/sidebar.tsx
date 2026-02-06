import Link from "next/link";
import { LayoutDashboard, Package, Users, Store, History, MessageSquare, Undo2 } from "lucide-react";
import { Tags } from "lucide-react"; // Import a 'Tag' icon

export default function AdminSidebar({ isOpen }: { isOpen: boolean }) {
    return (
        <aside
            className={`
                border-r bg-background transition-all duration-300 ease-in-out h-full overflow-y-auto
                ${isOpen ? "w-64" : "w-0 overflow-hidden"}
            `}
        >
            <div className="p-6 font-bold text-lg whitespace-nowrap">Fixkart Admin</div>

            <nav className="px-4 space-y-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted whitespace-nowrap"
                >
                    <LayoutDashboard size={18} className="flex-shrink-0" />
                    Dashboard
                </Link>

                <Link
                    href="/admin/orders"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted whitespace-nowrap"
                >
                    <Package size={18} className="flex-shrink-0" />
                    Orders
                </Link>

                <Link
                    href="/admin/orders-history"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <History size={18} className="flex-shrink-0" />
                    Order History
                </Link>

                <Link
                    href="/admin/vendors"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted whitespace-nowrap"
                >
                    <Store size={18} className="flex-shrink-0" />
                    Vendors
                </Link>
                <Link
                    href="/admin/onboarded-vendors"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted whitespace-nowrap"
                >
                    <Store size={18} className="flex-shrink-0" />
                    Onboarded Vendors
                </Link>

                <Link
                    href="/admin/inventory-approvals"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <Package size={18} className="flex-shrink-0" />
                    Inventory Approvals
                </Link>

                <Link
                    href="/admin/inventory"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <Package size={18} className="flex-shrink-0" />
                    Inventory
                </Link>

                <Link
                    href="/admin/customer-approvals"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <Users size={18} className="flex-shrink-0" />
                    Customer Approvals
                </Link>
                <Link
                    href="/admin/onboarded-customers"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <Users size={18} className="flex-shrink-0" />
                    Onboarded Customers
                </Link>



                <Link
                    href="/admin/users"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted whitespace-nowrap"
                >
                    <Users size={18} className="flex-shrink-0" />
                    Users
                </Link>

                {/* <Link
                    href="#"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <MessageSquare size={18} className="flex-shrink-0" />
                    Complaints
                </Link> */}
                <Link
                    href="/admin/complaints"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <MessageSquare size={18} className="flex-shrink-0" />
                    Complaints
                </Link>
                <Link
                    href="/admin/refunds"
                    // href="#"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <Undo2 size={18} className="flex-shrink-0" />
                    Returns and Refunds
                </Link>
            </nav>
        </aside>
    );
}
