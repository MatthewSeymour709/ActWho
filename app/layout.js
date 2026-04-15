import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Celebrity Trivia - Guess Who Edition",
  description:
    "A daily trivia game where you guess celebrities based on facts. Similar to Wordle but for celebrity trivia!",
  keywords: "trivia, celebrity, wordle, game, daily",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="three-hole-punch">
          <div className="hole top"></div>
          <div className="hole middle"></div>
          <div className="hole bottom"></div>
        </div>
        <Header />
        {children}
      </body>
    </html>
  );
}