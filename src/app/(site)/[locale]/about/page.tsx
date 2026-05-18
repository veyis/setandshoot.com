import { SectionPage } from "@/components/site/section-page";

export default function AboutPage(props: { params: Promise<{ locale: string }> }) {
  return <SectionPage {...props} namespace="pages.about" />;
}
