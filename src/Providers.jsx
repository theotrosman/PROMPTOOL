import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/LangContext'

export const Providers = ({ children }) => (
  <ThemeProvider>
    <LangProvider>
      {children}
    </LangProvider>
  </ThemeProvider>
)
