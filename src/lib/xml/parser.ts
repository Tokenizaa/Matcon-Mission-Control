/**
 * Simple NFe XML Parser foundation.
 * In a real scenario, this would use a library or more complex regex/DOM parsing.
 */
export interface ParsedNFE {
  key: string;
  number: string;
  date: string;
  total: number;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
}

export async function parseNfeXml(xmlContent: string): Promise<ParsedNFE> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  const getText = (selector: string) => xmlDoc.querySelector(selector)?.textContent || "";
  
  const infNFe = xmlDoc.querySelector("infNFe");
  if (!infNFe) throw new Error("XML não é uma NFe válida");

  const key = infNFe.getAttribute("Id")?.replace("NFe", "") || "";
  const number = getText("ide > nNF");
  const date = getText("ide > dhEmi");
  const total = parseFloat(getText("total > ICMSTot > vNF"));

  const detElements = xmlDoc.querySelectorAll("det");
  const items = Array.from(detElements).map((det) => {
    const prod = det.querySelector("prod");
    return {
      sku: prod?.querySelector("cProd")?.textContent || "",
      name: prod?.querySelector("xProd")?.textContent || "",
      quantity: parseFloat(prod?.querySelector("qCom")?.textContent || "0"),
      price: parseFloat(prod?.querySelector("vUnCom")?.textContent || "0"),
      unit: prod?.querySelector("uCom")?.textContent || "UN",
    };
  });

  return {
    key,
    number,
    date,
    total,
    items,
  };
}
