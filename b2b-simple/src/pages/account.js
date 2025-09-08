// pages/account.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/navbar";
import DashboardContent from "../components/components/DashboardContent";

// Keep this export because DashboardContent imports it from "../account"
export const COLORS = {
  DARK_BLUE: "#0a0a0a",
  BABY_BLUE: "#d7e9f7",
  LIGHT_GRAY: "#f8f9fa",
};

export default function Account() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("customer");
      if (!stored) {
        router.replace("/login");
        return;
      }
      setCustomer(JSON.parse(stored));
    } catch {
      router.replace("/login");
      return;
    } finally {
      setReady(true);
    }
  }, [router]);

  // Render nothing while we decide (prevents any flicker/jank)
  if (!ready) return null;

  // ✅ /account now *is* your dashboard
  return (
    <>
      
      <DashboardContent customer={customer} />
    </>
  );
}
