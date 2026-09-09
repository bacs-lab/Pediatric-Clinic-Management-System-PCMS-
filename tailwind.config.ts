import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          ink: "#17202a",
          line: "#d7dee8",
          surface: "#f7f9fb",
          teal: "#0f766e",
          red: "#b42318",
          amber: "#b54708",
        },
      },
    },
  },
  plugins: [],
};

export default config;
