export type FamilyNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  size?: number;
  image?: string;
};

export type FamilyDefinition = {
  nodes: FamilyNode[];
  families: { parents: string[]; children: string[]; connectorYOffset?: number }[];
};

export const familyData: FamilyDefinition = {
  nodes: [
    { id: "radagon", name: "radagon", x: 800, y: 80, size: 80, image: "/assets/radagon.png" },
    { id: "rennala", name: "rennala", x: 200, y: 80, size: 80, image: "/assets/rennala.png" },
    { id: "marika", name: "marika", x: 1400, y: 80, size: 80, image: "/assets/marika.png" },
    { id: "godfrey", name: "godfrey", x: 2000, y: 80, size: 80, image: "/assets/godfrey.png" },
    { id: "ranni", name: "ranni", x: 100, y: 280, size: 80, image: "/assets/ranni.png" },
    { id: "rykard", name: "rykard", x: 300, y: 280, size: 80, image: "/assets/rykard.png" },
    { id: "radahn", name: "general radahn", x: 500, y: 280, size: 80, image: "/assets/radahn.png" },
    { id: "malenia", name: "malenia", x: 900, y: 280, size: 80, image: "/assets/malenia.png" },
    { id: "miquella", name: "miquella", x: 1100, y: 280, size: 80, image: "/assets/miquella.png" },
    { id: "melina", name: "melina", x: 1300, y: 280, size: 80, image: "/assets/melina.png" },
    { id: "morgott", name: "morgott", x: 1700, y: 280, size: 80, image: "/assets/morgott.png" },
    { id: "mogh", name: "mohg", x: 1900, y: 280, size: 80, image: "/assets/mogh.png" },
    { id: "godwyn", name: "godwyn", x: 2100, y: 280, size: 80, image: "/assets/godwyn.png" },
    { id: "godrick", name: "godrick", x: 2100, y: 480, size: 80, image: "/assets/godrick.png" },
    
    // Malenia's unknown husband
    { id: "unknown_husband", name: "unknown", x: 700, y: 280, size: 80 },
    
    // Malenia's daughters
    { id: "millicent", name: "millicent", x: 500, y: 480, size: 80, image: "/assets/millicent.png" },
    { id: "mary", name: "mary", x: 650, y: 480, size: 80, image: "/assets/mary.png" },
    { id: "amy", name: "amy", x: 800, y: 480, size: 80, image: "/assets/amy.png" },
    { id: "polyanna", name: "polyanna", x: 950, y: 480, size: 80, image: "/assets/polyanna.png" },
    { id: "maureen", name: "maureen", x: 1100, y: 480, size: 80, image: "/assets/maureen.png" }
  ],
  families: [
    { parents: ["radagon", "rennala"], children: ["ranni", "rykard", "radahn"], connectorYOffset: 20 },
    { parents: ["radagon", "marika"], children: ["malenia", "miquella", "melina"], connectorYOffset: 20 },
    { parents: ["marika", "godfrey"], children: ["morgott", "mogh", "godwyn"], connectorYOffset: 20 },
    { parents: ["godwyn"], children: ["godrick"], connectorYOffset: 20 },
    { parents: ["unknown_husband", "malenia"], children: ["millicent", "mary", "amy", "polyanna", "maureen"], connectorYOffset: 20 }
  ]
};


