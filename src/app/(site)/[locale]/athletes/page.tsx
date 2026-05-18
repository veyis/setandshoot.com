import { SectionPage } from "@/components/site/section-page";

export default function AthletesPage(props: { params: Promise<{ locale: string }> }) {
  return <SectionPage {...props} namespace="pages.athletes" />;
}
