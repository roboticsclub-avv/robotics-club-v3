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
import MediaTab from "@/components/dashboard/MediaTab";
import ProjectsTab from "@/components/dashboard/ProjectsTab";

const DASHBOARD_TABS = [
  { id: "applicants", roles: ["admin"] },
  { id: "team", roles: ["admin", "technical"] },
  { id: "projects", roles: ["admin", "technical", "it"] },
  { id: "events", roles: ["admin", "ops"] },
  { id: "media", roles: ["admin", "media"] },
  { id: "inventory", roles: ["admin", "data"] },
  { id: "allocations", roles: ["admin", "data"] },
  { id: "meetings", roles: ["admin", "secretary"] },
  { id: "settings", roles: ["admin"] }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("applicants");
  const [isTabInitialized, setIsTabInitialized] = useState(false);
  const [hasOpened, setHasOpened] = useState({
    applicants: true
  });
  const { user, profile, logout } = useAuth();

  const userRole = profile?.role || "admin";
  const adminEmail = profile?.email || user?.email || "Admin";

  // Track which tabs have been opened to lazy-load them and keep them mounted
  useEffect(() => {
    if (activeTab) {
      setHasOpened((prev) => ({ ...prev, [activeTab]: true }));
    }
  }, [activeTab]);

  // Set the default tab to the first allowed tab for their role once profile loads
  useEffect(() => {
    if (profile?.role && !isTabInitialized) {
      const allowed = DASHBOARD_TABS.filter(t => t.roles.includes(profile.role));
      if (allowed.length > 0) {
        const isCurrentTabAllowed = allowed.some(t => t.id === activeTab);
        if (!isCurrentTabAllowed) {
          setActiveTab(allowed[0].id);
        }
        setIsTabInitialized(true);
      }
    }
  }, [profile, isTabInitialized, activeTab]);

  return (
    <AdminRoute>
      <DashboardShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminEmail={adminEmail}
        onLogout={logout}
        userRole={userRole}
        profile={profile}
      >
        <div className={activeTab === "applicants" ? "" : "hidden"}>
          {hasOpened.applicants && <ApplicantsTab />}
        </div>
        <div className={activeTab === "team" ? "" : "hidden"}>
          {hasOpened.team && <TeamTab />}
        </div>
        <div className={activeTab === "projects" ? "" : "hidden"}>
          {hasOpened.projects && <ProjectsTab />}
        </div>
        <div className={activeTab === "events" ? "" : "hidden"}>
          {hasOpened.events && <EventsTab />}
        </div>
        <div className={activeTab === "media" ? "" : "hidden"}>
          {hasOpened.media && <MediaTab />}
        </div>
        <div className={activeTab === "inventory" ? "" : "hidden"}>
          {hasOpened.inventory && <InventoryTab />}
        </div>
        <div className={activeTab === "allocations" ? "" : "hidden"}>
          {hasOpened.allocations && <AllocationsTab />}
        </div>
        <div className={activeTab === "meetings" ? "" : "hidden"}>
          {hasOpened.meetings && <MeetingsTab />}
        </div>
        <div className={activeTab === "settings" ? "" : "hidden"}>
          {hasOpened.settings && <SettingsTab adminEmail={adminEmail} />}
        </div>
      </DashboardShell>
    </AdminRoute>
  );
}

