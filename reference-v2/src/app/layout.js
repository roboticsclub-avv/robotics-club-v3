import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://eeseizfyjbuleedynhlx.supabase.co"),
  title: {
    default: "Robotics Club AVV | Innovation in Motion",
    template: "%s | Robotics Club AVV",
  },
  description:
    "Join the Robotics Club at Amrita Vishwa Vidyapeetham — where we build, innovate, and push the boundaries of robotics, AI, and automation. Explore projects, meet the team, and be part of the future.",
  keywords: ["robotics", "club", "AVV", "Amrita", "engineering", "AI", "automation", "innovation", "drone", "sumo bot"],
  authors: [{ name: "Robotics Club AVV" }],
  creator: "Robotics Club AVV",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
  },
  openGraph: {
    title: "Robotics Club AVV | Innovation in Motion",
    description: "Build, innovate, and push the boundaries of robotics and AI at Amrita Vishwa Vidyapeetham.",
    type: "website",
    locale: "en_IN",
    siteName: "Robotics Club AVV",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robotics Club AVV | Innovation in Motion",
    description: "Build, innovate, and push the boundaries of robotics and AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

import GlobalAlertContainer from "@/components/ui/GlobalAlertContainer";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
        {children}
        <GlobalAlertContainer />
      </body>
    </html>
  );
}
