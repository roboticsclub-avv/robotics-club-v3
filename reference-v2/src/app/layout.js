import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Robotics Club | Innovation in Motion",
  description:
    "Join the Robotics Club — where we build, innovate, and push the boundaries of robotics, AI, and automation. Explore projects, meet the team, and be part of the future.",
  keywords: ["robotics", "club", "engineering", "AI", "automation", "innovation"],
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
  },
  openGraph: {
    title: "Robotics Club | Innovation in Motion",
    description: "Build, innovate, and push the boundaries of robotics and AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
        {children}
      </body>
    </html>
  );
}
