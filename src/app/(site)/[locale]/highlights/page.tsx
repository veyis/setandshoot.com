import { SectionPage } from "@/components/site/section-page";

export default function HighlightsPage(props: { params: Promise<{ locale: string }> }) {
  return <SectionPage {...props} namespace="pages.highlights" />;
}
