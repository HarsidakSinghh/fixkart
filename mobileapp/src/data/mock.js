export const dashboardStats = {
  revenue: "12.4L",
  pendingOrders: 38,
  processingOrders: 64,
  completedOrders: 412,
  vendorsTotal: 286,
  vendorsApproved: 210,
  vendorsPending: 48,
  vendorsSuspended: 28,
};

export const weeklyRevenue = [
  { day: "Mon", value: 14 },
  { day: "Tue", value: 22 },
  { day: "Wed", value: 18 },
  { day: "Thu", value: 30 },
  { day: "Fri", value: 26 },
  { day: "Sat", value: 34 },
  { day: "Sun", value: 20 },
];

export const dashboardAlerts = [
  { id: "ALT-1", title: "3 high-priority refunds pending", tone: "warning" },
  { id: "ALT-2", title: "5 inventory approvals waiting", tone: "info" },
  { id: "ALT-3", title: "2 vendors suspended last 24h", tone: "danger" },
];

export const orders = [
  {
    id: "ORD-2026-021",
    customer: "Aarav Mehta",
    city: "Mumbai",
    amount: "18,900",
    status: "PENDING",
    placedAt: "2h ago",
  },
  {
    id: "ORD-2026-020",
    customer: "Isha Kapoor",
    city: "Pune",
    amount: "7,450",
    status: "APPROVED",
    placedAt: "5h ago",
  },
  {
    id: "ORD-2026-019",
    customer: "Rohan Das",
    city: "Delhi",
    amount: "32,110",
    status: "COMPLETED",
    placedAt: "1d ago",
  },
  {
    id: "ORD-2026-018",
    customer: "Sana Ali",
    city: "Hyderabad",
    amount: "11,700",
    status: "APPROVED",
    placedAt: "1d ago",
  },
  {
    id: "ORD-2026-017",
    customer: "Dev Jain",
    city: "Bengaluru",
    amount: "3,200",
    status: "PENDING",
    placedAt: "2d ago",
  },
];

export const ordersHistory = [
  { id: "ORD-2025-991", customer: "Farah Khan", amount: "9,600", status: "COMPLETED", city: "Noida" },
  { id: "ORD-2025-982", customer: "Kabir Singh", amount: "21,300", status: "COMPLETED", city: "Gurugram" },
  { id: "ORD-2025-977", customer: "Zoya Ansari", amount: "15,990", status: "REJECTED", city: "Lucknow" },
];

export const users = [
  { id: "USR-120", name: "Admin Pooja", role: "Super Admin", status: "ACTIVE" },
  { id: "USR-121", name: "Vikram Rao", role: "Ops Manager", status: "ACTIVE" },
  { id: "USR-122", name: "Jaya Nair", role: "Support", status: "SUSPENDED" },
];

export const products = [
  { id: "PRD-340", name: "AC Compressor", vendor: "CoolTech", status: "APPROVED", stock: 44 },
  { id: "PRD-341", name: "Motor Coupling", vendor: "FixKart", status: "PENDING", stock: 12 },
  { id: "PRD-342", name: "Control Board", vendor: "VoltNow", status: "REJECTED", stock: 0 },
];

export const inventory = [
  { id: "INV-710", item: "Refrigerant Gas", status: "LOW", warehouse: "Mumbai" },
  { id: "INV-711", item: "Pipe Insulation", status: "OK", warehouse: "Delhi" },
  { id: "INV-712", item: "Copper Coil", status: "CRITICAL", warehouse: "Bengaluru" },
];

export const inventoryApprovals = [
  { id: "APP-401", item: "Smart Thermostat", vendor: "HomeNext", status: "PENDING" },
  { id: "APP-402", item: "Heat Pump", vendor: "ClimaPro", status: "PENDING" },
];

export const vendors = [
  { id: "VEN-200", name: "CoolTech", city: "Mumbai", status: "APPROVED" },
  { id: "VEN-201", name: "VoltNow", city: "Delhi", status: "SUSPENDED" },
  { id: "VEN-202", name: "HomeNext", city: "Pune", status: "PENDING" },
];

export const onboardedVendors = [
  { id: "VEN-180", name: "FixKart", city: "Bengaluru", status: "APPROVED" },
  { id: "VEN-181", name: "AirPro", city: "Chennai", status: "APPROVED" },
];

export const customerApprovals = [
  { id: "CUS-590", name: "Meera Joshi", city: "Jaipur", status: "PENDING" },
  { id: "CUS-591", name: "Aman Gupta", city: "Kolkata", status: "PENDING" },
];

export const onboardedCustomers = [
  { id: "CUS-510", name: "Neha Roy", city: "Indore", status: "APPROVED" },
  { id: "CUS-511", name: "Rishi Patel", city: "Surat", status: "APPROVED" },
];

export const complaints = [
  { id: "CMP-100", subject: "Late delivery", priority: "HIGH", status: "OPEN" },
  { id: "CMP-101", subject: "Wrong part received", priority: "MEDIUM", status: "IN_REVIEW" },
];

export const refunds = [
  { id: "RFD-88", orderId: "ORD-2025-977", amount: "15,990", status: "PENDING" },
  { id: "RFD-89", orderId: "ORD-2025-965", amount: "4,200", status: "APPROVED" },
];
