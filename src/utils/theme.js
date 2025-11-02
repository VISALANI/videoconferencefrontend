// src/utils/theme.js
export const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.classList.contains("dark") ? "dark" : "light";

  if (currentTheme === "dark") {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
};

// Apply theme from local storage on load
export const applyStoredTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const html = document.documentElement;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
};
