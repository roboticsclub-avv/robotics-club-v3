"use client";

import React, { useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import useAuth from "@/hooks/useAuth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ApplicantsTab from "@/components/dashboard/ApplicantsTab";
import TeamTab from "@/components/dashboard/TeamTab";
import EventsTab from "@/components/dashboard/EventsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("applicants");
  const { user, profile, logout } = useAuth();

  const adminEmail = profile?.email || user?.email || "Admin";

  return (
    <AdminRoute>
      <DashboardShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminEmail={adminEmail}
        onLogout={logout}
      >
        {activeTab === "applicants" && <ApplicantsTab />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "events" && <EventsTab />}
        {activeTab === "settings" && <SettingsTab adminEmail={adminEmail} />}
      </DashboardShell>
    </AdminRoute>
  );
}

