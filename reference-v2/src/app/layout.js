import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import AlertProvider from "@/providers/AlertProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "Robotics Club Website 3.0",
  description: "Next-gen platform for Amrita Robotics Club",
};

import GlobalBackground from "@/components/GlobalBackground";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <AlertProvider>
              <GlobalBackground />
              {children}
            </AlertProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
