// src/data/wineries.ts
// Auto-generated dataset: 33 wineries, 5 wines each.
// Prices: 20 / 30 / 40 / 50 / 60 EUR

export type Wine = {
  id: string;
  name: string;
  meta?: string;
  priceEUR: number;
  priceNote?: string;
};

export type Winery = {
  slug: string;
  name: string;
  desc?: string;
  whatsapp?: string;
  email?: string;
  wines: Wine[];
};

const makeWines = (slugPrefix: string): Wine[] => ([
  { id: `${slugPrefix}-1`, name: "Brut Tradition", meta: "NV • Classic house style", priceEUR: 20 },
  { id: `${slugPrefix}-2`, name: "Blanc de Blancs", meta: "NV • Chardonnay", priceEUR: 30 },
  { id: `${slugPrefix}-3`, name: "Rosé", meta: "NV • Fresh red-fruit profile", priceEUR: 40 },
  { id: `${slugPrefix}-4`, name: "Vintage", meta: "2016 • Limited release", priceEUR: 50 },
  { id: `${slugPrefix}-5`, name: "Cuvée Prestige", meta: "NV • Top selection", priceEUR: 60 },
]);

export const WINERIES: Winery[] = [
  { slug: "le-gallais", name: "Le Gallais", desc: "Private selection for visitors.", wines: makeWines("legallais") },
  { slug: "maison-penet", name: "Maison Penet", desc: "Family house, approachable cuvées.", wines: makeWines("maisonpenet") },
  { slug: "lancelot-royer", name: "Lancelot Royer", desc: "Grower-producer from the region.", wines: makeWines("lancelotroyer") },
  { slug: "nicolas-maillart", name: "Nicolas Maillart", desc: "Boutique producer.", wines: makeWines("nicolasmaillart") },
  { slug: "bonnet-ponson", name: "Bonnet Ponson", desc: "Small estate with refined style.", wines: makeWines("bonnetponson") },
  { slug: "gaston-chiquet", name: "Gaston Chiquet", desc: "Traditional Champagne house.", wines: makeWines("gastonchiquet") },
  { slug: "ployez-jacquemart", name: "Ployez-Jacquemart", desc: "Family-run domain.", wines: makeWines("ployezjacquemart") },
  { slug: "michel-gonet", name: "Michel Gonet", desc: "Specialist in Chardonnay-driven cuvées.", wines: makeWines("michelgonet") },
  { slug: "henri-giraud", name: "Henri Giraud", desc: "Rare single-vineyard bottlings.", wines: makeWines("henrigiraud") },
  { slug: "lamiable", name: "Lamiablé", desc: "Grower focusing on terroir.", wines: makeWines("lamiable") },
  { slug: "vilmart", name: "Vilmart", desc: "Highly regarded grower Champagne.", wines: makeWines("vilmart") },
  { slug: "mailly-champagne", name: "Mailly Champagne", desc: "Prestige cuvées from Mailly.", wines: makeWines("mailly") },
  { slug: "gounel-lassalle", name: "Gounel-Lassalle", desc: "Family domaine.", wines: makeWines("gounellassalle") },
  { slug: "jm-labruyere", name: "JM Labruyère", desc: "Artisanal house.", wines: makeWines("jmlabruyere") },
  { slug: "bonnaire", name: "Bonnaire", desc: "Small family run domaine.", wines: makeWines("bonnaire") },
  { slug: "collery", name: "Collery", desc: "Traditional champagnes.", wines: makeWines("collery") },
  { slug: "eric-taillet", name: "Eric Taillet", desc: "Grower with expressive style.", wines: makeWines("erictaillet") },
  { slug: "konrat", name: "Konrat", desc: "Boutique producer.", wines: makeWines("konrat") },
  { slug: "ac-toullec", name: "AC Toullec", desc: "Family domaine.", wines: makeWines("actoullec") },
  { slug: "pierre-paillard", name: "Pierre Paillard", desc: "Champagne from grand cru sites.", wines: makeWines("pierrepaillard") },
  { slug: "clos-corbier", name: "Clos Corbier", desc: "Clos style single parcel cuvées.", wines: makeWines("closcorbier") },
  { slug: "lucien-collard", name: "Lucien Collard", desc: "Small grower Champagne.", wines: makeWines("luciencollard") },
  { slug: "mousse", name: "Moussé", desc: "Artisanal champagnes.", wines: makeWines("mousse") },
  { slug: "moet-chandon", name: "Moët & Chandon", desc: "Major house, well-known cuvées.", wines: makeWines("moet") },
  { slug: "veuve-clicquot", name: "Veuve Clicquot", desc: "Iconic Champagne house.", wines: makeWines("veuveclicquot") },
  { slug: "ruinart", name: "Ruinart", desc: "Oldest Champagne house.", wines: makeWines("ruinart") },
  { slug: "leclerc-briant", name: "Leclerc Briant", desc: "Innovative grower-producer.", wines: makeWines("leclercbriant") },
  { slug: "lanson", name: "Lanson", desc: "Historic house.", wines: makeWines("lanson") },
  { slug: "mumm", name: "G.H. Mumm", desc: "Large Champagne house.", wines: makeWines("mumm") },
  { slug: "taittinger", name: "Taittinger", desc: "Famous house with elegant style.", wines: makeWines("taittinger") },
  { slug: "pommery", name: "Pommery", desc: "Well-known estate.", wines: makeWines("pommery") },
  { slug: "perrier-jouet", name: "Perrier-Jouët", desc: "House noted for floral style.", wines: makeWines("perrierjouet") },
  { slug: "bollinger", name: "Bollinger", desc: "Prestige house known for power.", wines: makeWines("bollinger") }
];

export default WINERIES;
