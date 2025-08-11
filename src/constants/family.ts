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
    // Generation 1 - Parents (y: 80)
    { id: "rennala", name: "rennala", x: 200, y: 80, size: 80, image: "/assets/rennala.png" },
    { id: "radagon", name: "radagon", x: 600, y: 80, size: 80, image: "/assets/radagon.png" },
    { id: "marika", name: "marika", x: 1000, y: 80, size: 80, image: "/assets/marika.png" },
    { id: "godfrey", name: "godfrey", x: 1400, y: 80, size: 80, image: "/assets/godfrey.png" },
    { id: "unknown_wife_godfrey", name: "unknown", x: 1600, y: 80, size: 80 },
    
    // Generation 2 - Main children (y: 300)
    { id: "ranni", name: "ranni", x: 50, y: 300, size: 80, image: "/assets/ranni.png" },
    { id: "rykard", name: "rykard", x: 200, y: 300, size: 80, image: "/assets/rykard.png" },
    { id: "radahn", name: "general radahn", x: 350, y: 300, size: 80, image: "/assets/radahn.png" },
    { id: "miquella", name: "miquella", x: 800, y: 300, size: 80, image: "/assets/miquella.png" },
    { id: "melina", name: "melina", x: 950, y: 300, size: 80, image: "/assets/melina.png" },
    { id: "morgott", name: "morgott", x: 1100, y: 300, size: 80, image: "/assets/morgott.png" },
    { id: "mogh", name: "mohg", x: 1250, y: 300, size: 80, image: "/assets/mogh.png" },
    { id: "godwyn", name: "godwyn", x: 1400, y: 300, size: 80, image: "/assets/godwyn.png" },
    { id: "nepheli", name: "nepheli loux", x: 1550, y: 300, size: 80, image: "/assets/nepheli loux.png" },
    
    // Secondary couples (moved down)
    { id: "tanith", name: "tanith", x: 100, y: 480, size: 80, image: "/assets/tanith.png" },
    { id: "malenia", name: "malenia", x: 620, y: 500, size: 80, image: "/assets/malenia.png" },
    { id: "unknown_husband", name: "unknown", x: 800, y: 500, size: 80 },
    
    // Their children (y: 700)
    { id: "rya", name: "rya", x: 150, y: 650, size: 80, image: "/assets/rya.png" },
    { id: "millicent", name: "millicent", x: 400, y: 700, size: 80, image: "/assets/millicent.png" },
    { id: "mary", name: "mary", x: 520, y: 700, size: 80, image: "/assets/mary.png" },
    { id: "amy", name: "amy", x: 640, y: 700, size: 80, image: "/assets/amy.png" },
    { id: "polyanna", name: "polyanna", x: 760, y: 700, size: 80, image: "/assets/polyanna.png" },
    { id: "maureen", name: "maureen", x: 880, y: 700, size: 80, image: "/assets/maureen.png" },
    { id: "godrick", name: "godrick", x: 1300, y: 500, size: 80, image: "/assets/godrick.png" },
    { id: "godefroy", name: "godefroy the grafted", x: 1500, y: 500, size: 80, image: "/assets/godefroy the grafted.png" }
  ],
  families: [
    { parents: ["radagon", "rennala"], children: ["ranni", "rykard", "radahn"], connectorYOffset: 20 },
    { parents: ["radagon", "marika"], children: ["malenia", "miquella", "melina"], connectorYOffset: 20 },
    { parents: ["marika", "godfrey"], children: ["morgott", "mogh", "godwyn"], connectorYOffset: 20 },
    { parents: ["godfrey", "unknown_wife_godfrey"], children: ["nepheli"], connectorYOffset: 20 },
    { parents: ["godwyn"], children: ["godrick", "godefroy"], connectorYOffset: 20 },
    { parents: ["unknown_husband", "malenia"], children: ["millicent", "mary", "amy", "polyanna", "maureen"], connectorYOffset: 20 },
    { parents: ["tanith", "rykard"], children: ["rya"], connectorYOffset: 20 }
  ]
};


