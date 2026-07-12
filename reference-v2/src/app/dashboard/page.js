"use client";

import React, { useState, useEffect } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import useAuth from "@/hooks/useAuth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ApplicantsTab from "@/components/dashboard/ApplicantsTab";
import TeamTab from "@/components/dashboard/TeamTab";
import EventsTab from "@/components/dashboard/EventsTab";
import InventoryTab from "@/components/dashboard/InventoryTab";
import AllocationsTab from "@/components/dashboard/AllocationsTab";
import MeetingsTab from "@/components/dashboard/MeetingsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";

const DASHBOARD_TABS = [
  { id: "applicants", roles: ["admin"] },
  { id: "team", roles: ["admin", "technical"] },
  { id: "events", roles: ["admin", "ops"] },
  { id: "inventory", roles: ["admin", "data"] },
  { id: "allocations", roles: ["admin", "data"] },
  { id: "meetings", roles: ["admin", "secretary"] },
  { id: "settings", roles: ["admin"] }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("applicants");
  const { user, profile, logout } = useAuth();

  const userRole = profile?.role || "admin";
  const adminEmail = profile?.email || user?.email || "Admin";

  // Set the default tab to the first allowed tab for their role once profile loads
  useEffect(() => {
    if (profile?.role) {
      const allowed = DASHBOARD_TABS.filter(t => t.roles.includes(profile.role));
      if (allowed.length > 0) {
        setActiveTab(allowed[0].id);
      }
    }
  }, [profile]);

  return (
    <AdminRoute>
      <DashboardShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminEmail={adminEmail}
        onLogout={logout}
        userRole={userRole}
      >
        {activeTab === "applicants" && <ApplicantsTab />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "events" && <EventsTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "allocations" && <AllocationsTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "settings" && <SettingsTab adminEmail={adminEmail} />}
      </DashboardShell>
    </AdminRoute>
  );
}

