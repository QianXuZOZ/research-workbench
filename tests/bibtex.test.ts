import { describe, expect, it } from "vitest";
import { bibtexIdentity, parseBibtex } from "@/lib/bibtex";

describe("BibTeX parser", () => {
  it("parses nested braces and Chinese authors", () => {
    const source = `@article{demo2026,
      title={弱电网下 {IBR} 距离保护研究},
      author={张三 and 李四},
      journal={电力系统自动化},
      year={2026},
      doi={https://doi.org/10.1234/DEMO.1},
      abstract={包含 {嵌套} 内容的摘要}
    }`;
    const [entry] = parseBibtex(source);
    expect(entry.title).toBe("弱电网下 IBR 距离保护研究");
    expect(entry.authors).toBe("张三; 李四");
    expect(entry.year).toBe(2026);
    expect(entry.doi).toBe("10.1234/demo.1");
  });

  it("deduplicates by DOI before normalized title and year", () => {
    expect(bibtexIdentity({ doi: "10.1/Test", title: "A", year: 2026 })).toBe("doi:10.1/test");
    expect(bibtexIdentity({ doi: null, title: "Grid-Forming: Control", year: 2026 })).toBe("title:gridformingcontrol:2026");
  });

  it("ignores malformed or title-less entries", () => {
    expect(parseBibtex("@article{bad, author={A}}")).toEqual([]);
    expect(parseBibtex("not bibtex")).toEqual([]);
  });
});
