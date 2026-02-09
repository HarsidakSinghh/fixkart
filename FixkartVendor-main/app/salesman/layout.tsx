import { getSalesmanSession } from "@/app/actions/salesman-auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salesman Portal",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1", // Crucial for mobile feel
};

export default async function SalesmanLayout({ children }: { children: React.ReactNode }) {
  // 1. Check if user is logged in
  const salesman = await getSalesmanSession();
  
  // 2. Helper to check current path (server-side workaround)
  // Since we can't easily get pathname in server layout, we rely on the session check.
  // Ideally, if a salesman is logged in, they shouldn't see the login page, 
  // and if logged out, they shouldn't see dashboard.
  // However, simple middleware logic is best handled here by route groups or explicit checks.
  
  // LOGIC: If we are in this layout, we are under /salesman
  // But we can't block /login here, or we'd get an infinite loop.
  // Instead, we will protect the *Dashboard* page specifically in the next step (Day 3).
  // For now, this layout ensures mobile responsiveness.
  
  return (
    <div className="antialiased text-gray-900 bg-gray-50 min-h-screen">
       {children}
    </div>
  );
}