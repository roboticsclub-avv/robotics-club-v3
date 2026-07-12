"use client";

import React from "react";
import GlobalAlertContainer from "@/components/ui/GlobalAlertContainer";

export default function AlertProvider({ children }) {
  return (
    <>
      {children}
      <GlobalAlertContainer />
    </>
  );
}
