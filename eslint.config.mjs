import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "supabase/.branches/**",
      "src/types/database.generated.ts",
    ],
  },
];

export default config;
