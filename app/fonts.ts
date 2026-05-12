import localFont from "next/font/local";
import { Montserrat, Playfair_Display } from "next/font/google";

export const eastman = localFont({
  variable: "--font-eastman",
  display: "swap",
  src: [
    { path: "./fonts/EastmanAlternateTrial-Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/EastmanAlternateTrial-Extralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/EastmanAlternateTrial-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/EastmanAlternateTrial-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/EastmanAlternateTrial-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
