import "./globals.css";

export const metadata = {
  title: "Survey App",
  description: "Image selection survey application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
