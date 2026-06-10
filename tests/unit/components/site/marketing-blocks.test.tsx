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

  it("portraitFigure falls back to built-in portrait when no photo is set", () => {
    const portrait = {
      id: "3",
      blockType: "portraitFigure" as const,
      caption: "Belin Akguel",
    };
    render(<MarketingBlocks sections={[portrait]} locale="de" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByText("Belin Akguel")).toBeInTheDocument();
  });

  it("editorialProse splits credits on newlines into separate spans", () => {
    const prose = {
      id: "4",
      blockType: "editorialProse" as const,
      credits: "LINE A\nLINE B\nLINE C",
    };
    render(<MarketingBlocks sections={[prose]} locale="de" />);
    expect(screen.getByText("LINE A")).toBeInTheDocument();
    expect(screen.getByText("LINE B")).toBeInTheDocument();
    expect(screen.getByText("LINE C")).toBeInTheDocument();
  });

  it("editorialProse drops blank lines from credits", () => {
    const prose = {
      id: "5",
      blockType: "editorialProse" as const,
      credits: "X\n\nY",
    };
    const { container } = render(<MarketingBlocks sections={[prose]} locale="de" />);
    const spans = container.querySelectorAll("span");
    expect(spans).toHaveLength(2);
    expect(spans[0]!.textContent).toBe("X");
    expect(spans[1]!.textContent).toBe("Y");
  });
});
