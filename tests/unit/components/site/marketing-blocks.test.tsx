import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingBlocks } from "@/components/site/marketing-blocks";

const header = {
  id: "1",
  blockType: "pageHeader" as const,
  label: "Bereich",
  title: "Über mich",
  intro: "Intro.",
};
const cta = {
  id: "2",
  blockType: "ctaLink" as const,
  label: "Anfrage stellen",
  target: "/contact" as const,
};

describe("MarketingBlocks", () => {
  it("renders nothing when sections are empty", () => {
    const { container } = render(<MarketingBlocks sections={[]} locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders header text and cta in order", () => {
    render(<MarketingBlocks sections={[header, cta]} locale="de" />);
    expect(screen.getByRole("heading", { level: 1, name: "Über mich" })).toBeInTheDocument();
    expect(screen.getByText("Intro.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Anfrage stellen/ });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("skips unknown block types", () => {
    const unknown = { id: "9", blockType: "mystery" } as never;
    const { container } = render(<MarketingBlocks sections={[unknown]} locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });
});
