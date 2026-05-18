import { SectionPage } from "@/components/site/section-page";

export default function JournalPage(props: { params: Promise<{ locale: string }> }) {
  return <SectionPage {...props} namespace="pages.journal" />;
}
