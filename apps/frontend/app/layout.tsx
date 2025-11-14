import './globals.css'

export const metadata = {
  title: 'Chat App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  )
}
