export const exampleCatalog = [
  {
    id: "substation",
    nameKey: "exampleSubstation",
    view: "schematic",
    category: "power",
  },
  {
    id: "photovoltaic",
    nameKey: "examplePhotovoltaic",
    view: "schematic",
    category: "power",
  },
  {
    id: "motor",
    nameKey: "exampleMotor",
    view: "schematic",
    category: "industrial",
  },
  {
    id: "building",
    nameKey: "exampleBuilding",
    view: "building",
    category: "building",
  },
  {
    id: "plc",
    nameKey: "examplePlc",
    view: "automation",
    category: "automation",
  },
] as const;
export type ExampleId = (typeof exampleCatalog)[number]["id"];
