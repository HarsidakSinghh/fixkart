import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/theme";
import { customerColors } from "./src/customer/CustomerTheme";
import * as SecureStore from "expo-secure-store";
import BottomNav from "./src/components/BottomNav";
import DashboardScreen from "./src/screens/DashboardScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import OrdersHistoryScreen from "./src/screens/OrdersHistoryScreen";
import UsersScreen from "./src/screens/UsersScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import InventoryScreen from "./src/screens/InventoryScreen";
import InventoryApprovalsScreen from "./src/screens/InventoryApprovalsScreen";
import VendorsScreen from "./src/screens/VendorsScreen";
import OnboardedVendorsScreen from "./src/screens/OnboardedVendorsScreen";
import CustomerApprovalsScreen from "./src/screens/CustomerApprovalsScreen";
import OnboardedCustomersScreen from "./src/screens/OnboardedCustomersScreen";
import ComplaintsScreen from "./src/screens/ComplaintsScreen";
import RefundsScreen from "./src/screens/RefundsScreen";
import MoreScreen from "./src/screens/MoreScreen";
import SupportScreen from "./src/screens/SupportScreen";
import ApprovalsScreen from "./src/screens/ApprovalsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import useTokenRefresh from "./src/hooks/useTokenRefresh";
import { CartProvider } from "./src/context/CartContext";
import { ToastProvider } from "./src/components/Toast";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import CustomerPortal from "./src/customer/CustomerPortal";
import VendorPortal from "./src/vendor/VendorPortal";
import SalesmanPortal from "./src/salesman/SalesmanPortal";
import SalesmenScreen from "./src/screens/SalesmenScreen";
import VendorRegisterScreen from "./src/vendor/VendorRegisterScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

function LoadingScreen({ message = "Loading FixKart...", showLogo = false }) {
  return (
    <View style={styles.loadingContainer}>
      {showLogo ? (
        <Image source={require("./assets/logo1.png")} style={styles.loadingLogo} />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

function AdminAppContent() {
  const [active, setActive] = useState("dashboard");

  const routes = useMemo(
    () => ({
      dashboard: {
        key: "dashboard",
        label: "Dashboard",
        subtitle: "KPI overview",
        icon: "grid",
        component: DashboardScreen,
      },
      approvals: {
        key: "approvals",
        label: "Approvals",
        subtitle: "Pending actions",
        icon: "check-circle",
        component: ApprovalsScreen,
      },
      orders: {
        key: "orders",
        label: "Orders",
        subtitle: "Live pipeline",
        icon: "shopping-bag",
        component: OrdersScreen,
      },
      ordersHistory: {
        key: "ordersHistory",
        label: "Orders History",
        subtitle: "Archived orders",
        icon: "archive",
        component: OrdersHistoryScreen,
      },
      users: {
        key: "users",
        label: "Users",
        subtitle: "Admin access",
        icon: "shield",
        component: UsersScreen,
      },
      products: {
        key: "products",
        label: "Products",
        subtitle: "Catalog control",
        icon: "package",
        component: ProductsScreen,
      },
      inventory: {
        key: "inventory",
        label: "Inventory",
        subtitle: "Warehouse stock",
        icon: "box",
        component: InventoryScreen,
      },
      inventoryApprovals: {
        key: "inventoryApprovals",
        label: "Inventory Approvals",
        subtitle: "Pending listings",
        icon: "clipboard",
        component: InventoryApprovalsScreen,
      },
      vendors: {
        key: "vendors",
        label: "Vendors",
        subtitle: "Partner management",
        icon: "truck",
        component: VendorsScreen,
      },
      onboardedVendors: {
        key: "onboardedVendors",
        label: "Onboarded Vendors",
        subtitle: "Approved partners",
        icon: "user-check",
        component: OnboardedVendorsScreen,
      },
      customerApprovals: {
        key: "customerApprovals",
        label: "Customer Approvals",
        subtitle: "Pending access",
        icon: "user-plus",
        component: CustomerApprovalsScreen,
      },
      onboardedCustomers: {
        key: "onboardedCustomers",
        label: "Onboarded Customers",
        subtitle: "Verified accounts",
        icon: "users",
        component: OnboardedCustomersScreen,
      },
      support: {
        key: "support",
        label: "Support",
        subtitle: "Complaints and refunds",
        icon: "help-circle",
        component: SupportScreen,
      },
      complaints: {
        key: "complaints",
        label: "Complaints",
        subtitle: "Escalations",
        icon: "alert-triangle",
        component: ComplaintsScreen,
      },
      refunds: {
        key: "refunds",
        label: "Refunds",
        subtitle: "Finance desk",
        icon: "rotate-ccw",
        component: RefundsScreen,
      },
      salesmen: {
        key: "salesmen",
        label: "Salesmen",
        subtitle: "Field team",
        icon: "map-pin",
        component: SalesmenScreen,
      },
      more: {
        key: "more",
        label: "More",
        subtitle: "All sections",
        icon: "menu",
        component: MoreScreen,
      },
    }),
    []
  );

  const bottomTabs = [
    routes.dashboard,
    routes.approvals,
    routes.orders,
    routes.support,
    routes.more,
  ];
  const moreRoutes = [
    routes.ordersHistory,
    routes.products,
    routes.inventory,
    routes.salesmen,
    routes.vendors,
    routes.onboardedVendors,
    routes.onboardedCustomers,
    routes.users,
  ];

  const ActiveComponent = routes[active]?.component || DashboardScreen;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {active === "more" ? (
          <MoreScreen routes={moreRoutes} onNavigate={setActive} />
        ) : (
          <ActiveComponent onNavigate={setActive} />
        )}
      </View>
      <BottomNav tabs={bottomTabs} activeKey={active} onChange={setActive} />
    </View>
  );
}

function AppGate() {
  const { isLoading, isAuthenticated, isAdmin, isVendor, isSalesmanAuthenticated } = useAuth();
  const [portal, setPortal] = useState('customer');
  const [portalReady, setPortalReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('customer');
  const [showVendorRegister, setShowVendorRegister] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [roleSyncing, setRoleSyncing] = useState(false);
  const [postLoginWait, setPostLoginWait] = useState(false);

  useTokenRefresh();
  usePushNotifications({
    enabled: isAuthenticated,
    role: isAdmin ? "ADMIN" : isVendor ? "VENDOR" : "CUSTOMER",
  });

  const setPortalPersist = useCallback((next) => {
    setPortal(next);
    SecureStore.setItemAsync("last_portal", next);
  }, []);

  useEffect(() => {
    async function loadPortal() {
      try {
        const stored = await SecureStore.getItemAsync("last_portal");
        if (stored) setPortal(stored);
      } finally {
        setPortalReady(true);
      }
    }
    loadPortal();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated || isSalesmanAuthenticated) {
      setShowWelcome(false);
    }
  }, [isAuthenticated, isSalesmanAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const target = isAdmin ? 'admin' : isVendor ? 'vendor' : null;
    if (!target) return;
    if (portal !== target) {
      setRoleSyncing(true);
      setPortalPersist(target);
      const timer = setTimeout(() => setRoleSyncing(false), 600);
      return () => clearTimeout(timer);
    }
    setRoleSyncing(false);
  }, [isAuthenticated, isAdmin, isVendor, portal, setPortalPersist]);

  if (isLoading || !portalReady || roleSyncing || postLoginWait) {
    return (
      <LoadingScreen
        message={postLoginWait ? "Signing you in..." : "Preparing your workspace..."}
        showLogo={postLoginWait}
      />
    );
  }

  let content = null;
  let safeBg = colors.bg;

  if (showSplash) {
    safeBg = colors.bg;
    content = (
      <View style={styles.splash}>
        <Image source={require("./assets/logo1.png")} style={styles.splashLogo} />
        <Text style={styles.splashTag}>Industrial Supply, Simplified.</Text>
      </View>
    );
  } else if (showWelcome && !isAuthenticated && !isSalesmanAuthenticated && !showLogin && !showVendorRegister) {
    safeBg = colors.bg;
    content = (
      <WelcomeScreen
        onLogin={() => {
          setLoginMode("customer");
          setShowLogin(true);
          setShowWelcome(false);
        }}
        onContinue={() => {
          setShowWelcome(false);
          setPortalPersist("customer");
        }}
      />
    );
  } else
  if (showVendorRegister) {
    safeBg = colors.bg;
    content = <VendorRegisterScreen onClose={() => setShowVendorRegister(false)} />;
  } else if (showLogin) {
    safeBg = loginMode === 'customer' ? customerColors.primary : colors.bg;
    content = (
      <LoginScreen
        mode={loginMode}
        onModeChange={setLoginMode}
        onClose={() => setShowLogin(false)}
        onRegisterVendor={() => {
          setShowLogin(false);
          setShowVendorRegister(true);
        }}
        onLoginSuccess={(selectedRole) => {
          setShowLogin(false);
          setRoleSyncing(true);
          setPostLoginWait(true);
          setPortalPersist(selectedRole || loginMode || 'customer');
          setTimeout(() => {
            setRoleSyncing(false);
            setPostLoginWait(false);
          }, 4000);
        }}
      />
    );
  } else if (portal === 'admin') {
    safeBg = colors.bg;
    if (!isAuthenticated || !isAdmin) {
      content = (
        <LoginScreen
          mode="admin"
          onModeChange={setLoginMode}
          onClose={() => setPortalPersist('customer')}
          onLoginSuccess={() => setPortalPersist('admin')}
        />
      );
    } else {
      content = <AdminAppContent />;
    }
  } else if (portal === 'vendor') {
    safeBg = colors.bg;
    if (!isAuthenticated || !isVendor) {
      content = (
        <LoginScreen
          mode="vendor"
          onModeChange={setLoginMode}
          onClose={() => setPortalPersist('customer')}
          onLoginSuccess={() => setPortalPersist('vendor')}
        />
      );
    } else {
      content = <VendorPortal />;
    }
  } else if (portal === 'salesman') {
    safeBg = colors.bg;
    if (!isSalesmanAuthenticated) {
      content = (
        <LoginScreen
          mode="salesman"
          onModeChange={setLoginMode}
          onClose={() => setPortalPersist('customer')}
          onLoginSuccess={() => setPortalPersist('salesman')}
        />
      );
    } else {
      content = <SalesmanPortal />;
    }
  } else {
    safeBg = customerColors.primary;
    content = (
      <CustomerPortal
        onOpenLogin={() => {
          setLoginMode('customer');
          setShowLogin(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: safeBg }]}>
      {content}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppGate />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 16,
  },
  loadingLogo: {
    width: 160,
    height: 44,
    resizeMode: "contain",
  },
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  splashBrand: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4,
  },
  splashLogo: {
    width: 180,
    height: 48,
    resizeMode: "contain",
  },
  splashTag: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1,
  },
});
