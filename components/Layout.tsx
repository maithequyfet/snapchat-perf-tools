import Navbar from './Navbar';
import Footer from './Footer';
import { ReactNode, useState } from 'react';
import { AnalyticsWrapper } from './Analytics';

export default function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const onThemeChange = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  };
  return (
    <main data-theme={theme}>
      <Navbar theme={theme} onThemeChange={onThemeChange} />
      <main>{children}</main>
      <AnalyticsWrapper />
      <Footer />
    </main>
  );
}
