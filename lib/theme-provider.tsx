import { useTheme } from "next-themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {children}
      <div className="theme-toggle">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className="p-2 rounded-md hover:bg-gray-200/10 transition-colors"
        >
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 9v3" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 1-1 3-3 3s-3-2-3-3" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.5 17a6.9 6.9 0 1 1 0-13.4A6.9 6.9 0 0 1 12.5 17" />
              <path d="M12 1v2" />
              <path d="M12 21v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M4.93 19.07l1.41-1.41" />
              <path d="M17.66 7.34l1.41-1.41" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}