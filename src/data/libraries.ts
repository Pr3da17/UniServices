export interface Library {
  id: string;
  name: string;
  token: string;
  city: string;
}

export const artoisLibraries: Library[] = [
  {
    id: "arras-robinson",
    name: "BU Robinson (Lettres, SHS)",
    city: "Arras",
    token: "4ebe411f-45d1-4f69-ac02-41bb19914758"
  },
  {
    id: "lievin-staps",
    name: "BU Liévin (STAPS)",
    city: "Liévin",
    token: "a2bc987c-cef6-4720-a266-207f0745ab21"
  },
  {
    id: "douai-droit",
    name: "BU Douai (Droit)",
    city: "Douai",
    token: "d82b151a-1ebb-49b6-8811-42d1dae1eabf"
  },
  {
    id: "lens-sciences",
    name: "BU Lens (Sciences)",
    city: "Lens",
    token: "d914e332-68c6-4135-8248-f2305e82443b"
  },
  {
    id: "lens-iut",
    name: "BU IUT Lens",
    city: "Lens",
    token: "a7c9f124-8884-43da-9c8e-37b6cc610829"
  },
  {
    id: "bethune-sciences",
    name: "BU Béthune (Sciences Appliquées)",
    city: "Béthune",
    token: "80df98be-b0aa-4d7a-bdaf-3bd8a644468a"
  }
];
