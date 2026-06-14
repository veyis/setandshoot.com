import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/json-ld";

describe("JsonLd", () => {
  it("renders a ld+json script with the serialized data", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Person", name: "Belin" }} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.innerHTML)).toMatchObject({ "@type": "Person", name: "Belin" });
  });

  it("escapes a closing script tag to prevent breakout", () => {
    const { container } = render(<JsonLd data={{ x: "</script>" }} />);
    expect(container.querySelector("script")!.innerHTML).not.toContain("</script>");
  });
});
