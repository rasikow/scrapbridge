import {
  Cable, Container, Anvil, PackageOpen, Disc3, Weight, BatteryFull, Cpu,
  Recycle, Newspaper, Syringe, HardHat, CircleDot, Shirt, GlassWater,
  TreePine, Leaf, Boxes,
} from 'lucide-react'

// A distinct icon per material category so listings read as visually
// differentiated at a glance, layered over the existing swatch-color
// gradient — not a substitute for real photography, but considerably
// richer than one generic box icon reused for all 17 categories.
export const MATERIAL_ICONS = {
  copper: Cable,
  steel: Container,
  iron: Anvil,
  aluminium: PackageOpen,
  brass: Disc3,
  lead: Weight,
  batteries: BatteryFull,
  ewaste: Cpu,
  plastic: Recycle,
  paper: Newspaper,
  medical: Syringe,
  cdw: HardHat,
  rubber: CircleDot,
  textile: Shirt,
  glass: GlassWater,
  wood: TreePine,
  organic: Leaf,
}

export function getMaterialIcon(materialId) {
  return MATERIAL_ICONS[materialId] || Boxes
}
