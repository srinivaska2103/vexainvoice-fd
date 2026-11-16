import './globals.css';
import Providers from './providers';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover'
};

export const metadata = {
  title: 'Vexa Invoice',
  description: 'Commercial business billing, inventory, customer, supplier, payment, and reporting system.',
  icons: {
    icon: [
      { url: '/vexa-logo.png?v=2', type: 'image/png' },
      { url: '/logo.png?v=2', type: 'image/png' }
    ],
    shortcut: '/vexa-logo.png?v=2',
    apple: '/vexa-logo.png?v=2'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/vexa-logo.png?v=2" />
        <link rel="shortcut icon" href="/vexa-logo.png?v=2" />
        <link rel="apple-touch-icon" href="/vexa-logo.png?v=2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window !== 'undefined' && window.location.search && (window.location.search.indexOf('password=') !== -1 || window.location.search.indexOf('email=') !== -1)) {
                    var s = window.location.search
                      .replace(/[?&]password=[^&#]*/gi, '')
                      .replace(/[?&]email=[^&#]*/gi, '');
                    if (s.startsWith('&')) s = '?' + s.slice(1);
                    var cleanUrl = window.location.pathname + (s && s !== '?' ? s : '') + window.location.hash;
                    window.history.replaceState(null, '', cleanUrl);
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
