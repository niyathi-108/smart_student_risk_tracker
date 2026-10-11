export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — ScholarRisk` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — ScholarRisk` },
    { property: "og:description", content: description },
  ],
});
