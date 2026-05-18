import { SectionPage } from "@/components/site/section-page";

export default function StoriesPage(props: { params: Promise<{ locale: string }> }) {
  return <SectionPage {...props} namespace="pages.stories" />;
}
