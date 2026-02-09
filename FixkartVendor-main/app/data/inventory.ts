// 1. Define Interfaces
export interface Item {
  name: string;
  imagePath: string;
  categoryId?: string;
  quantity?: number;
}

export interface Category {
  title: string;
  slug: string;
  parentCategory?: string; // <--- This enables the auto-fetch feature
  items: Item[];
}

// 2. Slug Helper (Cleaned up to prevent triple dashes)
const toSlug = (text: string) => 
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const INVENTORY_DATA: Category[] = [
  {
    title: "Fastening & Joining",
    slug: toSlug("Fastening & Joining"),
    items: [
      {
        name: "Anchors",
        imagePath: "/fastening\\anchor.webp",
        categoryId: "Cat-001",
        quantity: undefined
      },
      // {
      //   name: "Bolts", imagePath: "/fastening\\bolts.webp",
      //   quantity: undefined
      // },
      {
        name: "Studs", imagePath: "/fastening\\studs.jpg",
        quantity: undefined
      },
      // {
      //   name: "Anchors", imagePath: "/fastening\\anchor.webp",
      //   quantity: undefined
      // },
      {
        name: "Threaded Rods", imagePath: "/fastening\\threaded-rods.jpg",
        quantity: undefined
      },
      {
        name: "U-Bolts", imagePath: "/fastening\\u-bolts.jpg",
        quantity: undefined
      },
      {
        name: "Nails", imagePath: "/fastening\\nails.jpg",
        quantity: undefined
      },
      {
        name: "Nuts", imagePath: "/fastening\\nuts.jpg",
        quantity: undefined
      },
      // {
      //   name: "Pins", imagePath: "/fastening\\pins.jpg",
      //   quantity: undefined
      // },
      {
        name: "Retaining Rings", imagePath: "/fastening\\retaining-rings.jpg",
        quantity: undefined
      },
      {
        name: "Staples", imagePath: "/fastening\\staples.jpg",
        quantity: undefined
      },
      {
        name: "Rivets", imagePath: "/fastening\\rivets.jpg",
        quantity: undefined
      },
      {
        name: "Pins", imagePath: "/fastening\\pins.jpg",
        quantity: undefined
      },
      {
        name: "Cable Ties", imagePath: "/fastening\\cable-ties.jpg",
        quantity: undefined
      },
      {
        name: "Key Stock", imagePath: "/fastening\\keystock.jpg",
        quantity: undefined
      },
      {
        name: "Magnets", imagePath: "/fastening\\magnets.jpg",
        quantity: undefined
      },
      {
        name: "Spacers", imagePath: "/fastening\\spacers.jpg",
        quantity: undefined
      },
      // {
      //   name: "Staples", imagePath: "/fastening\\staples.jpg",
      //   quantity: undefined
      // },
      // {
      //   name: "Studs", imagePath: "/fastening\\studs.jpg",
      //   quantity: undefined
      // },
      // {
      //   name: "Threaded Rods", imagePath: "/fastening\\threaded-rods.jpg",
      //   quantity: undefined
      // },
      // {
      //   name: "U-Bolts", imagePath: "/fastening\\u-bolts.jpg",
      //   quantity: undefined
      // },
      {
        name: "Washers", imagePath: "/fastening\\washers.jpg",
        quantity: undefined
      },
      {
        name: "Drywall Screws", imagePath: "/fastening\\screws.jpg",
        quantity: undefined
      },{
        name: "Torx Screws", imagePath: "/fastening\\stainless-steel-torx-screws-stainless-steel-torx-screws-isolated-white-background-215582969.webp",
        quantity: undefined
      },{
        name: "Slotted Screws", imagePath: "/fastening\\slotted.jpg",
        quantity: undefined
      },{
        name: "CSK Screws", imagePath: "/fastening\\csk.webp",
        quantity: undefined
      },{
        name: "Panhead Screws", imagePath: "/fastening\\pan head.jpg",
        quantity: undefined
      },{
        name: "Self-tapping PenHead Screws", imagePath: "/fastening\\pan-head-self-tapping-screws.jpg",
        quantity: undefined
      },{
        name: "Self-tapping CSK", imagePath: "/fastening\\selftappingcsk.jpg",
        quantity: undefined
      },{
        name: "Pan Phillips Self Driving Screw", imagePath: "/fastening\\66eaa4e6fb349eb8f98facfd.avif",
        quantity: undefined
      },{
        name: "SDS Screws", imagePath: "/fastening\\sds.jpg",
        quantity: undefined
      },{
        name: "Phillips RoundHead Screws", imagePath: "/fastening\\philips-roundhead.webp",
        quantity: undefined
      },{
        name: "Flange Combination Waterhead Screws", imagePath: "/fastening\\Flanged_Combination_head_washer_head_SS_304_Screw.webp",
        quantity: undefined
      },{
        name: "allen CounterSunk Screws", imagePath: "/fastening\\allen.webp",
        quantity: undefined
      },
      {
        name: "CBC Screws", imagePath: "/fastening\\cbc.jpg",
        quantity: undefined
      },{
        name: "JCBC Screws", imagePath: "/fastening\\jcbc.jpg",
        quantity: undefined
      },{
        name: "ButtonHead Screws", imagePath: "/fastening\\buttonhead.jpg",
        quantity: undefined
      },
      {
        name: "Hex Bolts", imagePath: "/fastening\\bolts.webp",
        quantity: undefined
      },
      {
        name: "Flange Bolts", imagePath: "/fastening\\flange-bolt.jpg",
        quantity: undefined
      },
      {
        name: "SquareHead Bolts", imagePath: "/fastening\\SquareHead-bolts.jpg",
        quantity: undefined
      },
      {
        name: "Allen Bolts", imagePath: "/fastening\\allen-bolts.webp",
        quantity: undefined
      },
      {
        name: "CSK Bolts", imagePath: "/fastening\\csk-bolt.jpg",
        quantity: undefined
      },
      {
        name: "Anti-Theft Bolts", imagePath: "/fastening\\anti-theft.webp",
        quantity: undefined
      },
      {
        name: "Carriage Bolts", imagePath: "/fastening\\carriage-bolt.jpg",
        quantity: undefined
      },
      {
        name: "Foundation Bolts", imagePath: "/fastening\\foundation-bolt.webp",
        quantity: undefined
      },
      {
        name: "Eye Bolts", imagePath: "/fastening\\eye-bolt.webp",
        quantity: undefined
      },
      {
        name: "Elevator Bolts", imagePath: "/fastening\\elevator-bolt.webp",
        quantity: undefined
      },
      {
        name: "J-Anchor Bolts", imagePath: "/fastening\\j-anchor.avif",
        quantity: undefined
      },
            {
        name: "Lag Bolts", imagePath: "/fastening\\lag-bolt.jpg",
        quantity: undefined
      },
            {
        name: "Plow Bolts", imagePath: "/fastening\\plow.jpg",
        quantity: undefined
      },
            {
        name: "Rock Bolts", imagePath: "/fastening\\rock-bolt.avif",
        quantity: undefined
      },
            {
        name: "Shoulder Bolts", imagePath: "/fastening\\shoulder-bolt.jpeg",
        quantity: undefined
      },
            {
        name: "SocketHead Bolts", imagePath: "/fastening\\socket-head.jpg",
        quantity: undefined
      },
            {
        name: "Thread Bolts", imagePath: "/fastening\\thread-bolt.jpg",
        quantity: undefined
      },
          {
        name: "Track Bolts", imagePath: "/fastening\\track-bolt.jpg",
        quantity: undefined
      },

    ],
  },
  {
    title: "Abrading & Polishing",
    slug: toSlug("Abrading & Polishing"),
    items: [
      {
        name: "Abrasive Belts", imagePath: "/abrasive\\belt.jpg",
        quantity: undefined
      }, // Example: Real image path
      {
        name: "Abrasive Discs", imagePath: "/abrasive\\discs.jpg",
        quantity: undefined
      },
      {
        name: "Abrasive Wheels", imagePath: "/abrasive\\abrasive-wheels.jpg",
        quantity: undefined
      },
      {
        name: "Buffing Wheels", imagePath: "/abrasive\\buffing-wheels.jpg",
        quantity: undefined
      },
      {
        name: "Deburring Tools", imagePath: "/abrasive\\deburring-tools.jpg",
        quantity: undefined
      },
      {
        name: "Files", imagePath: "/abrasive\\files.jpg",
        quantity: undefined
      },
      {
        name: "Grinding Wheels", imagePath: "/abrasive\\grinding-wheels.jpg",
        quantity: undefined
      },
      {
        name: "Honing Tools", imagePath: "/abrasive\\honing-tools.jpg",
        quantity: undefined
      },
      {
        name: "Polishing Compounds",
        imagePath: "/abrasive\\polishing-compound.webp",
        quantity: undefined
      },
      {
        name: "Sandpaper", imagePath: "/abrasive\\sandpaper.jpg",
        quantity: undefined
      },
      {
        name: "Sharpening Stones",
        imagePath: "/abrasive\\sharpening-stones.webp",
        quantity: undefined
      },
      {
        name: "Wire Brushes", imagePath: "/abrasive\\wire-brushes.jpg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Power Tools",
    slug: toSlug("Power Tools"),
    items: [
      {
        name: "Cordless Tool Tracking Tags",
        imagePath: "/power-tools\\tracking-tags.png",
        quantity: undefined
      },
      {
        name: "Cordless Tool Jobsite Fans",
        imagePath: "/power-tools\\jobsite-fans.jpg",
        quantity: undefined
      },
      {
        name: "Cordless Tool Batteries & Power Accessories",
        imagePath: "/power-tools\\batteries-accessories.webp",
        quantity: undefined
      },
      {
        name: "Cordless Tool Combination Kits",
        imagePath: "/power-tools\\combination-kits.jpg",
        quantity: undefined
      },
      {
        name: "Cordless Tool Jobsite Radios & Speakers",
        imagePath: "/power-tools\\radios-speakers.jpg",
        quantity: undefined
      },
      {
        name: "Impact Wrenches, Power Torque Wrenches & Power Ratchets",
        imagePath: "/power-tools\\impact-wrenches.avif",
        quantity: undefined
      },
      {
        name: "Cordless Tool Lighting",
        imagePath: "/power-tools\\lighting.jpg",
        quantity: undefined
      },
      {
        name: "Drills & Drivers",
        imagePath: "/power-tools\\drills-drivers.webp",
        quantity: undefined
      },
      {
        name: "Grinders & Cut-Off Tools",
        imagePath: "/power-tools\\grinders.webp",
        quantity: undefined
      },
      {
        name: "Heat Guns, Heat Blowers & Hot Knives",
        imagePath: "/power-tools\\heat-guns.jpg",
        quantity: undefined
      },
      {
        name: "Mud Mixers & Concrete Vibrators",
        imagePath: "/power-tools\\mud-mixers.webp",
        quantity: undefined
      },
      {
        name: "Power Planers, Jointers & Joiners",
        imagePath: "/power-tools\\planers-jointers.avif",
        quantity: undefined
      },
      {
        name: "Electrician's Power Tools",
        imagePath: "/power-tools\\electrition-tools.jpg",
        quantity: undefined
      },
      {
        name: "Plumbing Power Tools",
        imagePath: "/power-tools\\plumbing-tools.webp",
        quantity: undefined
      },
      {
        name: "Power Punching Tools",
        imagePath: "/power-tools\\punching-tools.jpg",
        quantity: undefined
      },
      {
        name: "Sanding & Finishing Tools",
        imagePath: "/power-tools\\sanding-finishing.jpg",
        quantity: undefined
      },
      {
        name: "Engravers & Accessories",
        imagePath: "/power-tools\\engravers.jpg",
        quantity: undefined
      },
      {
        name: "Power Saws & Blades",
        imagePath: "/power-tools\\saws-blades.jpg",
        quantity: undefined
      },
      {
        name: "Power Shears & Nibblers",
        imagePath: "/power-tools\\shears-nibblers.jpg",
        quantity: undefined
      },
      {
        name: "Nail Guns, Staple Guns & Rivet Tools",
        imagePath: "/power-tools\\nail-guns.jpg",
        quantity: undefined
      },
      {
        name: "Rebar Tying Tools, Cutters & Benders",
        imagePath: "/power-tools\\rebar-tools.png",
        quantity: undefined
      },
      {
        name: "Rotary Hammers, Demolition Hammers & Breaker Hammers",
        imagePath: "/power-tools\\rotary-hammers.webp",
        quantity: undefined
      },
      {
        name: "Routers, Bits & Wood Shapers",
        imagePath: "/power-tools\\router.jpg",
        quantity: undefined
      },
      {
        name: "Silica Dust Extractors & Dust Abatement Sprayers",
        imagePath: "/power-tools\\dust-extractors.webp",
        quantity: undefined
      },
      {
        name: "Power Tool Replacement Parts",
        imagePath: "/power-tools\\replacement-parts.webp",
        quantity: undefined
      },
      {
        name: "Rotary Tools, Oscillating Tools & Cut-Out Tools",
        imagePath: "/power-tools\\rotary-oscillating.jpg",
        quantity: undefined
      },
      {
        name: "Woodturning Lathes", imagePath: "/power-tools\\lathes.webp",
        quantity: undefined
      },
      {
        name: "Wood Dust Collection & Air Filtration",
        imagePath: "/power-tools\\dust-collection.webp",
        quantity: undefined
      },
      {
        name: "Cold Blowers", imagePath: "/heating&cooling/blowers.webp",
        quantity: undefined
      },
    ],
  },
   {
    title: "Hand Tools",
    slug: toSlug("Hand Tools"),
    items: [
      // Example
      {
        name: "Crimpers", imagePath: "/handtools/crimpers.jpg",
        quantity: undefined
      },
      {
        name: "Files", imagePath: "/handtools/files.avif",
        quantity: undefined
      },
      {
        name: "Hammers", imagePath: "/handtools/hammer.webp",
        quantity: undefined
      }, // Example
      {
        name: "Knives", imagePath: "/handtools/knives.jpg",
        quantity: undefined
      },
      {
        name: "Multi-Tools", imagePath: "/handtools/multitools.jpg",
        quantity: undefined
      },
      {
        name: "Pliers", imagePath: "/handtools/pliers.webp",
        quantity: undefined
      },
      {
        name: "Pry Bars", imagePath: "/handtools/pry-bars.jpg",
        quantity: undefined
      },
      {
        name: "Ratchets", imagePath: "/handtools/ratches.jpg",
        quantity: undefined
      },
      {
        name: "Saws", imagePath: "/handtools/saw.webp",
        quantity: undefined
      },
      {
        name: "Screwdrivers", imagePath: "/handtools/screwdriver.webp",
        quantity: undefined
      }, // Example
      {
        name: "Sockets", imagePath: "/handtools/sockets.jpg",
        quantity: undefined
      },
      {
        name: "Staplers", imagePath: "/handtools/staplers.jpg",
        quantity: undefined
      },
      {
        name: "Wrenches", imagePath: "/handtools/wrenches.avif",
        quantity: undefined
      },
    ],
  },
   {
    title: "Electrical & Lighting",
    slug: toSlug("Electrical & Lighting"),
    items: [
      {
        name: "Batteries", imagePath: "/electrical\\batteries.jpg",
        quantity: undefined
      },
      {
        name: "Circuit Breakers",
        imagePath: "/electrical\\circuit-breakers.jpg",
        quantity: undefined
      },
      {
        name: "Conduit", imagePath: "/electrical\\conduit.jpg",
        quantity: undefined
      },
      {
        name: "Electrical Boxes",
        imagePath: "/electrical\\electrical-boxes.jpg",
        quantity: undefined
      },
      {
        name: "Extension Cords",
        imagePath: "/electrical\\extension-cords.webp",
        quantity: undefined
      },
      {
        name: "Fuses", imagePath: "/electrical\\fuses.jpg",
        quantity: undefined
      },
      {
        name: "Light Bulbs", imagePath: "/electrical\\light-bulbs.webp",
        quantity: undefined
      },
      {
        name: "Lighting Fixtures",
        imagePath: "/electrical\\light-fixture.avif",
        quantity: undefined
      },
      {
        name: "Outlets & Plugs", imagePath: "/electrical\\outlets-plugs.webp",
        quantity: undefined
      },
      {
        name: "Switches", imagePath: "/electrical\\switches.webp",
        quantity: undefined
      },
      {
        name: "Transformers", imagePath: "/electrical\\transformer.webp",
        quantity: undefined
      },
      {
        name: "Wire & Cable", imagePath: "/electrical\\wire-cables.webp",
        quantity: undefined
      },
     {
        name: "LED Lights", imagePath: "/electrical\\led-lights.jpeg",
        quantity: undefined
      },
      {
        name: "Voltage Stablizer", imagePath: "/electrical\\voltage-stablizer.jpg",
        quantity: undefined
      },
    ],
  },
   {
    title: "Office Supplies & Signs",
    slug: toSlug("Office Supplies & Signs"),
    items: [
      {
        name: "Boards & Easels", imagePath: "/office-supplies/boards.webp",
        quantity: undefined
      },
      {
        name: "Cleaning Supplies",
        imagePath: "/office-supplies/cleaning-supplies.jpg",
        quantity: undefined
      },
      {
        name: "Envelopes", imagePath: "/office-supplies/envelopes.jpg",
        quantity: undefined
      },
      {
        name: "Labels", imagePath: "/office-supplies/labels.jpg",
        quantity: undefined
      },
      {
        name: "Office Furniture",
        imagePath: "/office-supplies/office-furniture.webp",
        quantity: undefined
      },
      {
        name: "Paper", imagePath: "/office-supplies/paper.jpg",
        quantity: undefined
      },
      {
        name: "Pens & Pencils",
        imagePath: "/office-supplies/pens-pencils.jpg",
        quantity: undefined
      },
      {
        name: "Tags", imagePath: "/office-supplies/tags.jpg",
        quantity: undefined
      },
    ],
  },

  {
    title: "Building & Grounds",
    slug: toSlug("Building & Grounds"),
    items: [
      {
        name: "Acoustic Tiles",
        imagePath: "/building&grounds\\acoustic-tiles.jpg",
        quantity: undefined
      },
      {
        name: "Awnings", imagePath: "/building&grounds\\Awnings.webp",
        quantity: undefined
      },
      {
        name: "Barriers & Railings",
        imagePath: "/building&grounds\\barriers-railings.jpg",
        quantity: undefined
      },
      {
        name: "Doors", imagePath: "/building&grounds\\doors.webp",
        quantity: undefined
      },
      {
        name: "Drainage", imagePath: "/building&grounds\\drainage.avif",
        quantity: undefined
      },
      {
        name: "Flooring", imagePath: "/building&grounds\\flooring.webp",
        quantity: undefined
      },
      {
        name: "Grounds Maintenance",
        imagePath: "/building&grounds\\ground-maintainance.jpg",
        quantity: undefined
      },
      {
        name: "Ladders", imagePath: "/building&grounds\\ladders.jpg",
        quantity: undefined
      },
      {
        name: "Matting", imagePath: "/building&grounds\\matting.jpg",
        quantity: undefined
      },
      {
        name: "Stairs", imagePath: "/building&grounds\\stairs.jpg",
        quantity: undefined
      },
      {
        name: "Windows", imagePath: "/building&grounds\\windows.webp",
        quantity: undefined
      },
    ],
  },
   {
    title: "Sawing & Cutting",
    slug: toSlug("Sawing & Cutting"),
    items: [
      {
        name: "Bandsaw Blades",
        imagePath: "/sawing-cutting/bandsaw-blades.jpg",
        quantity: undefined
      },
      {
        name: "Circular Saw Blades",
        imagePath: "/sawing-cutting/circular-saw-blades.webp",
        quantity: undefined
      },
      {
        name: "Cut-Off Wheels",
        imagePath: "/sawing-cutting/cut-off-wheels.jpg",
        quantity: undefined
      },
      {
        name: "Dies", imagePath: "/sawing-cutting/dies.jpg",
        quantity: undefined
      },
      {
        name: "Drill Bits", imagePath: "/sawing-cutting/drill-bits.jpg",
        quantity: undefined
      },
      {
        name: "End Mills", imagePath: "/sawing-cutting/end-mills.png",
        quantity: undefined
      },
      {
        name: "Hole Saws", imagePath: "/sawing-cutting/hole-saws.jpg",
        quantity: undefined
      },
      {
        name: "Jigsaw Blades", imagePath: "/sawing-cutting/jigsaw-blades.jpg",
        quantity: undefined
      },
      {
        name: "Knives", imagePath: "/sawing-cutting/knives.jpg",
        quantity: undefined
      },
      {
        name: "Reamers", imagePath: "/sawing-cutting/reamers.jpg",
        quantity: undefined
      },
      {
        name: "Reciprocating Saw Blades",
        imagePath: "/sawing-cutting/reciprocating-saw-blades.jpg",
        quantity: undefined
      },
      {
        name: "Taps", imagePath: "/sawing-cutting/taps.avif",
        quantity: undefined
      },
    ],
  },
   {
    title: "Sealing",
    slug: toSlug("Sealing"),
    items: [
      {
        name: "Compression Packing",
        imagePath: "/sealing/compression-packing.jpg",
        quantity: undefined
      },
      {
        name: "Gaskets", imagePath: "/sealing/gaskets.jpg",
        quantity: undefined
      },
      {
        name: "O-Rings", imagePath: "/sealing/o-rings.jpg",
        quantity: undefined
      },
      {
        name: "Sealants", imagePath: "/sealing/sealants.jpg",
        quantity: undefined
      },
      {
        name: "Thread Sealants", imagePath: "/sealing/thread-sealants.webp",
        quantity: undefined
      },
      {
        name: "Weatherstripping", imagePath: "/sealing/weatherstripping.jpg",
        quantity: undefined
      },
    ],
  },
   {
    title: "Welding",
    slug: toSlug("Welding"),
    items: [
      {
        name: "Air Carbon Arc", imagePath: "/welding/air-carbon-arc.webp",
        quantity: undefined
      },
      {
        name: "Arc Welding", imagePath: "/welding/arc-welding.webp",
        quantity: undefined
      },
      {
        name: "Filler Metals", imagePath: "/welding/filler-metals.webp",
        quantity: undefined
      },
    {
        name: "Gas Equipment", imagePath: "/welding/gas-equipment.avif",
        quantity: undefined
      },
      {
        name: "Plasma Cutting", imagePath: "/welding/plasma-cutter.jpg",
        quantity: undefined
      },
      {
        name: "Plastic Welding", imagePath: "/welding/plastic-welding.webp",
        quantity: undefined
      },
      {
        name: "Soldering", imagePath: "/welding/soldering.jpg",
        quantity: undefined
      },
      {
        name: "Spot Welding", imagePath: "/welding/spot-welding.jpg",
        quantity: undefined
      },
      {
        name: "Stud Welding", imagePath: "/welding/stud-welding.webp",
        quantity: undefined
      },
      {
        name: "Weld Cleaning", imagePath: "/welding/weld-cleaning.webp",
        quantity: undefined
      },
      {
        name: "Weld Fixturing", imagePath: "/welding/weld-fixture.jpg",
        quantity: undefined
      },
      {
        name: "Weld Testing", imagePath: "/welding/weld-testing.jpg",
        quantity: undefined
      },
      {
        name: "Area Protection", imagePath: "/welding/area-protection.webp",
        quantity: undefined
      },
       {
        name: "Fume Extraction", imagePath: "/welding/fume-extractor.jpg",
        quantity: undefined
      },
      
    ],  

  },
   {
    title: "Shipping",
    slug: toSlug("Shipping"),
    items: [
      {
        name: "Bags", imagePath: "/shipping/bags.jpg",
        quantity: undefined
      },
      {
        name: "Boxes", imagePath: "/shipping/boxes.jpg",
        quantity: undefined
      },
      {
        name: "Bubble Wrap", imagePath: "/shipping/bubble-wrap.jpg",
        quantity: undefined
      },
      {
        name: "Packing Peanuts", imagePath: "/shipping/packing-peanuts.jpg",
        quantity: undefined
      },
      {
        name: "Pallets", imagePath: "/shipping/pallets.webp",
        quantity: undefined
      },
      {
        name: "Shrink Wrap", imagePath: "/shipping/shrink-wrap.jpg",
        quantity: undefined
      },
      {
        name: "Strapping", imagePath: "/shipping/strapping.jpg",
        quantity: undefined
      },
      {
        name: "Tape", imagePath: "/shipping/tape.jpg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Safety Supplies",
    slug: toSlug("Safety Supplies"),
    items: [
      {
        name: "Clothing", imagePath: "/safety-supplies/clothing.jpg",
        quantity: undefined
      },
      {
        name: "Ear Protection",
        imagePath: "/safety-supplies/ear-protection.jpg",
        quantity: undefined
      },
      {
        name: "Eye Protection",
        imagePath: "/safety-supplies/eye-protection.jpg",
        quantity: undefined
      },
      {
        name: "Fall Protection",
        imagePath: "/safety-supplies/fall-protection.jpg",
        quantity: undefined
      },
      {
        name: "Fire Extinguishers",
        imagePath: "/safety-supplies/fire-extinguishers.jpg",
        quantity: undefined
      },
      {
        name: "First Aid", imagePath: "/safety-supplies/first-aid.jpg",
        quantity: undefined
      },
      {
        name: "Gloves", imagePath: "/safety-supplies/gloves.jpeg",
        quantity: undefined
      },
      {
        name: "Hard Hats", imagePath: "/safety-supplies/hard-hats.webp",
        quantity: undefined
      },
      {
        name: "Masks", imagePath: "/safety-supplies/masks.jpg",
        quantity: undefined
      },
      {
        name: "Respirators", imagePath: "/safety-supplies/respirators.avif",
        quantity: undefined
      },
      {
        name: "Safety Shoes", imagePath: "/safety-supplies/safety-shoes.jpg",
        quantity: undefined
      },
      {
        name: "Vests", imagePath: "/safety-supplies/vests.avif",
        quantity: undefined
      },
    ],
  },
   {
    title: "Measuring & Inspecting",
    slug: toSlug("Measuring & Inspecting"),
    items: [
      {
        name: "Calipers", imagePath: "/measuring/calipers.jpg",
        quantity: undefined
      },
      {
        name: "Gauges", imagePath: "/measuring/gauges.webp",
        quantity: undefined
      },
      {
        name: "Indicators", imagePath: "/measuring/indicators.jpg",
        quantity: undefined
      },
      {
        name: "Levels", imagePath: "/measuring/levels.webp",
        quantity: undefined
      },
      {
        name: "Magnifiers", imagePath: "/measuring/mabnifiers.jpg",
        quantity: undefined
      },
      {
        name: "Micrometers", imagePath: "/measuring/micrometers.webp",
        quantity: undefined
      },
      {
        name: "Microscopes", imagePath: "/measuring/microscopes.webp",
        quantity: undefined
      },
      {
        name: "Protractors", imagePath: "/measuring/protactors.webp",
        quantity: undefined
      },
      {
        name: "Rulers", imagePath: "/measuring/rulers.jpg",
        quantity: undefined
      },
      {
        name: "Scales", imagePath: "/measuring/scales.webp",
        quantity: undefined
      },
      {
        name: "Squares", imagePath: "/measuring/squares.jpg",
        quantity: undefined
      },
      {
        name: "Tape Measures", imagePath: "/measuring/tape-measure.jpg",
        quantity: undefined
      },
      {
        name: "Thermometers", imagePath: "/measuring/thermometers.webp",
        quantity: undefined
      },
    ],
  },
   {
    title: "Lubricating",
    slug: toSlug("Lubricating"),
    items: [
      {
        name: "Dispensing Equipment",
        imagePath: "/lubricants/dispensive-equipment.jpg",
        quantity: undefined
      },
      {
        name: "Funnels", imagePath: "/lubricants/funnels.jpg",
        quantity: undefined
      },
      {
        name: "Grease", imagePath: "/lubricants/grease.jpg",
        quantity: undefined
      },
      {
        name: "Grease Guns", imagePath: "/lubricants/grease-guns.jpg",
        quantity: undefined
      },
      {
        name: "Lubricants", imagePath: "/lubricants/lubricants.jpg",
        quantity: undefined
      },
      {
        name: "Lubricators", imagePath: "/lubricants/lubricators.png",
        quantity: undefined
      },
      {
        name: "Oilers", imagePath: "/lubricants/oilers.jpg",
        quantity: undefined
      },
      {
        name: "Oils", imagePath: "/lubricants/oils.avif",
        quantity: undefined
      },
    ],
  },
   {
    title: "Heating & Cooling",
    slug: toSlug("Heating & Cooling"),
    items: [
      {
        name: "Air Conditioners", imagePath: "/heating&cooling/ac.avif",
        quantity: undefined
      },
      {
        name: "Chillers", imagePath: "/heating&cooling/chillers.jpg",
        quantity: undefined
      },
      {
        name: "Ducting", imagePath: "/heating&cooling/ducting.jpg",
        quantity: undefined
      },
      {
        name: "Fans", imagePath: "/heating&cooling/fans.webp",
        quantity: undefined
      },
      {
        name: "Heat Exchangers",
        imagePath: "/heating&cooling/heat-exchangers.webp",
        quantity: undefined
      },
      {
        name: "Heaters", imagePath: "/heating&cooling/heaters.jpg",
        quantity: undefined
      },
      {
        name: "HVAC Controls", imagePath: "/heating&cooling/hvac.jpg",
        quantity: undefined
      },
      {
        name: "Thermostats", imagePath: "/heating&cooling/thermostat.webp",
        quantity: undefined
      },
      {
        name: "Vents", imagePath: "/heating&cooling/vents.jpg",
        quantity: undefined
      },
      {
        name: "Geyser", imagePath: "/heating&cooling/geyser.webp",
        quantity: undefined
      },
    ],
  },
   {
    title: "Furniture & Storage",
    slug: toSlug("Furniture & Storage"),
    items: [
      {
        name: "Bins & Totes", imagePath: "/furniture\\bins-totes.png",
        quantity: undefined
      },
      {
        name: "Cabinets", imagePath: "/furniture\\cabinets.webp",
        quantity: undefined
      },
      {
        name: "Carts", imagePath: "/furniture\\carts.jpg",
        quantity: undefined
      },
      {
        name: "Chairs & Stools", imagePath: "/furniture\\chairs.webp",
        quantity: undefined
      },
      {
        name: "Desks", imagePath: "/furniture\\desks.webp",
        quantity: undefined
      },
      {
        name: "Drawers", imagePath: "/furniture\\drawers.jpg",
        quantity: undefined
      },
      {
        name: "Lockers", imagePath: "/furniture\\lockers.webp",
        quantity: undefined
      },
      {
        name: "Racks", imagePath: "/furniture\\racks.jpg",
        quantity: undefined
      },
      {
        name: "Shelving", imagePath: "/furniture\\shelving.webp",
        quantity: undefined
      },
      {
        name: "Workbenches", imagePath: "/furniture\\workbenches.jpg",
        quantity: undefined
      },
    ],
  },

   {
    title: "Material Handling",
    slug: toSlug("Material Handling"),
    items: [
      {
        name: "Cranes", imagePath: "/material-handling/cranes.png",
        quantity: undefined
      },
      {
        name: "Dock Equipment",
        imagePath: "/material-handling/dock-equipment.jpg",
        quantity: undefined
      },
      {
        name: "Dollies", imagePath: "/material-handling/dollies.webp",
        quantity: undefined
      },
      {
        name: "Drum Handling",
        imagePath: "/material-handling/dum-handling.webp",
        quantity: undefined
      },
      {
        name: "Forklifts", imagePath: "/material-handling/forklifts.webp",
        quantity: undefined
      },
      {
        name: "Hoists", imagePath: "/material-handling/Hoists.webp",
        quantity: undefined
      },
      {
        name: "Jacks", imagePath: "/material-handling/jacks.webp",
        quantity: undefined
      },
      {
        name: "Lift Tables", imagePath: "/material-handling/lift-tables.png",
        quantity: undefined
      },
      {
        name: "Pallet Trucks",
        imagePath: "/material-handling/pallet-trucks.webp",
        quantity: undefined
      },
      {
        name: "Slings", imagePath: "/material-handling/slings.jpg",
        quantity: undefined
      },
      {
        name: "Winches", imagePath: "/material-handling/winches.jpg",
        quantity: undefined
      },
    ],
  },
  
  {
    title: "Fabricating",
    slug: toSlug("Fabricating"),
    items: [
      {
        name: "Insulation", imagePath: "/fabricating\\insulation.jpg",
        quantity: undefined
      },
      {
        name: "Machine Guards",
        imagePath: "/fabricating\\machine-guards.webp",
        quantity: undefined
      },
      {
        name: "Noise Control", imagePath: "/fabricating\\noise-control.jpg",
        quantity: undefined
      },
      {
        name: "Plastic Fabrication",
        imagePath: "/fabricating\\plastic-fabrications.png",
        quantity: undefined
      },
      {
        name: "Sheet Metal Tools",
        imagePath: "/fabricating\\sheet-metal-tools.jpg",
        quantity: undefined
      },
      {
        name: "Shim Stock", imagePath: "/fabricating\\shim-stock.jpg",
        quantity: undefined
      },
      {
        name: "Vibration Control Mounts",
        imagePath: "/fabricating\\vibration-control-mounts.jpg",
        quantity: undefined
      },
    ],
  },

  {
    title: "Filtering",
    slug: toSlug("Filtering"),
    items: [
      {
        name: "Air Filters", imagePath: "/filtering\\air-filters.webp",
        quantity: undefined
      },
      {
        name: "Compressed Air Filters",
        imagePath: "/filtering\\compressed-air-filter.jpg",
        quantity: undefined
      },
      {
        name: "Filter Bags", imagePath: "/filtering\\filter-bags.webp",
        quantity: undefined
      },
      {
        name: "Filter Cartridges",
        imagePath: "/filtering\\filter-cartridge.jpg",
        quantity: undefined
      },
      {
        name: "Hydraulic Filters", imagePath: "/filtering\\hydraulic.jpg",
        quantity: undefined
      },
      {
        name: "Liquid Filters", imagePath: "/filtering\\liquid-filters.jpg",
        quantity: undefined
      },
      {
        name: "Oil Filters", imagePath: "/filtering\\oil-filters.webp",
        quantity: undefined
      },
      {
        name: "Strainers", imagePath: "/filtering\\strainers.jpg",
        quantity: undefined
      },
      {
        name: "Water Filters", imagePath: "/filtering\\water-filters.jpg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Flow & Level Control",
    slug: toSlug("Flow & Level Control"),
    items: [
      {
        name: "Flow Switches", imagePath: "/flow\\flow-switches.jpg",
        quantity: undefined
      },
      {
        name: "Flowmeters", imagePath: "/flow\\flowmeters.png",
        quantity: undefined
      },
      {
        name: "Gauges", imagePath: "/flow\\gauges.webp",
        quantity: undefined
      },
      {
        name: "Level Switches", imagePath: "/flow\\level-switches.jpg",
        quantity: undefined
      },
      {
        name: "Pumps", imagePath: "/flow\\pumps.webp",
        quantity: undefined
      },
      {
        name: "Regulators", imagePath: "/flow\\regulators.jpg",
        quantity: undefined
      },
      {
        name: "Solenoid Valves", imagePath: "/flow\\solenoid-valve.webp",
        quantity: undefined
      },
      {
        name: "Valves", imagePath: "/flow\\valves.png",
        quantity: undefined
      },
    ],
  },
 
 
  {
    title: "Hardware",
    slug: toSlug("Hardware"),
    items: [
      {
        name: "Bumpers", imagePath: "/hardware\\bumpers.jpg",
        quantity: undefined
      },
      {
        name: "Casters", imagePath: "/hardware\\casters.jpg",
        quantity: undefined
      },
      {
        name: "Door Hardware", imagePath: "/hardware\\door-hardware.png",
        quantity: undefined
      },
      {
        name: "Drawer Slides", imagePath: "/hardware\\drawer-sliders.jpg",
        quantity: undefined
      },
      {
        name: "Handles", imagePath: "/hardware\\handles.jpg",
        quantity: undefined
      },
      {
        name: "Hinges", imagePath: "/hardware\\hinges.jpg",
        quantity: undefined
      },
      {
        name: "Hooks", imagePath: "/hardware\\hooks.webp",
        quantity: undefined
      },
      {
        name: "Knobs", imagePath: "/hardware\\knobs.jpg",
        quantity: undefined
      },
      {
        name: "Latches", imagePath: "/hardware\\latches.webp",
        quantity: undefined
      },
      {
        name: "Locks", imagePath: "/hardware\\locks.jpg",
        quantity: undefined
      },
      {
        name: "Springs", imagePath: "/hardware\\springs.jpg",
        quantity: undefined
      },
    ],
  },
 
 
 
 
 
  {
    title: "Pipe, Tubing, Hose & Fittings",
    slug: toSlug("Pipe, Tubing, Hose & Fittings"),
    items: [
      {
        name: "Hose", imagePath: "/pipes/hose.jpg",
        quantity: undefined
      },
      {
        name: "Hose Clamps", imagePath: "/pipes/hose-clamps.jpg",
        quantity: undefined
      },
      {
        name: "Hose Fittings", imagePath: "/pipes/hose-fittings.jpg",
        quantity: undefined
      },
      {
        name: "Hose Reels", imagePath: "/pipes/hose-reel.jpg",
        quantity: undefined
      },
      {
        name: "Manifolds", imagePath: "/pipes/manifolds.jpg",
        quantity: undefined
      },
      {
        name: "Pipe", imagePath: "/pipes/pipe.jpg",
        quantity: undefined
      },
      {
        name: "Pipe Fittings", imagePath: "/pipes/pipe-fittings.jpg",
        quantity: undefined
      },
      {
        name: "Pipe Hangers", imagePath: "/pipes/pipe-hangers.jpg",
        quantity: undefined
      },
      {
        name: "Tank Fittings", imagePath: "/pipes/tank-fittings.jpg",
        quantity: undefined
      },
      {
        name: "Tube Benders", imagePath: "/pipes/tube-benders].jpg",
        quantity: undefined
      },
      {
        name: "Tube Cutters", imagePath: "/pipes/tube-cutters.webp",
        quantity: undefined
      },
      {
        name: "Tubing", imagePath: "/pipes/tubinng.jpg",
        quantity: undefined
      },
    ],
  },

  {
    title: "Plumbing & Janitorial",
    slug: toSlug("Plumbing & Janitorial"),
    items: [
      {
        name: "Bathroom Fixtures",
        imagePath: "/plumbing-janitorial/bathroom-fixtures.jpg",
        quantity: undefined
      },
      {
        name: "Cleaning Chemicals",
        imagePath: "/plumbing-janitorial/cleaning-chemical.jpeg",
        quantity: undefined
      },
      {
        name: "Drains", imagePath: "/plumbing-janitorial/drains.webp",
        quantity: undefined
      },
      {
        name: "Faucets", imagePath: "/plumbing-janitorial/faucets.jpg",
        quantity: undefined
      },
      {
        name: "Mops & Brooms",
        imagePath: "/plumbing-janitorial/mops-brooms.jpg",
        quantity: undefined
      },
      {
        name: "Paper Products", imagePath: "/plumbing-janitorial/papers.jpg",
        quantity: undefined
      },
      {
        name: "Pumps", imagePath: "/plumbing-janitorial/pumps.jpg",
        quantity: undefined
      },
      {
        name: "Sinks", imagePath: "/plumbing-janitorial/sinks.jpg",
        quantity: undefined
      },
      {
        name: "Toilets", imagePath: "/plumbing-janitorial/toilet.webp",
        quantity: undefined
      },
      {
        name: "Trash Cans", imagePath: "/plumbing-janitorial/trash-cans.webp",
        quantity: undefined
      },
      {
        name: "Water Heaters",
        imagePath: "/plumbing-janitorial/water-heater.webp",
        quantity: undefined
      },
    ],
  },
  {
    title: "Power Transmission",
    slug: toSlug("Power Transmission"),
    items: [
      {
        name: "Bearings", imagePath: "/power-transmission/bearings.jpg",
        quantity: undefined
      },
      {
        name: "Belts", imagePath: "/power-transmission/belts.jpg",
        quantity: undefined
      },
      {
        name: "Bushings", imagePath: "/power-transmission/bushings.avif",
        quantity: undefined
      },
      {
        name: "Chains", imagePath: "/power-transmission/chains.webp",
        quantity: undefined
      },
      {
        name: "Clutches", imagePath: "/power-transmission/clutches.jpg",
        quantity: undefined
      },
      {
        name: "Couplings", imagePath: "/power-transmission/couplings.jpg",
        quantity: undefined
      },
      {
        name: "Gears", imagePath: "/power-transmission/gears.jpg",
        quantity: undefined
      },
      {
        name: "Linear Motion",
        imagePath: "/power-transmission/linear-motion.jpg",
        quantity: undefined
      },
      {
        name: "Motors", imagePath: "/power-transmission/motor.jpg",
        quantity: undefined
      },
      {
        name: "Pulleys", imagePath: "/power-transmission/pulleys.webp",
        quantity: undefined
      },
      {
        name: "Shafts", imagePath: "/power-transmission/shafts.webp",
        quantity: undefined
      },
      {
        name: "Sprockets", imagePath: "/power-transmission/sprockets.jpg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Pressure & Temperature Control",
    slug: toSlug("Pressure & Temperature Control"),
    items: [
      {
        name: "Controllers",
        imagePath: "/pressure-temperature-control/controllers.jpg",
        quantity: undefined
      },
      {
        name: "Gauges", imagePath: "/pressure-temperature-control/gauges.jpg",
        quantity: undefined
      },
      {
        name: "Heating Elements",
        imagePath: "/pressure-temperature-control/heating-elements.jpg",
        quantity: undefined
      },
      {
        name: "Pressure Switches",
        imagePath: "/pressure-temperature-control/pressure-switches.webp",
        quantity: undefined
      },
      {
        name: "Recorders",
        imagePath: "/pressure-temperature-control/recorders.png",
        quantity: undefined
      },
      {
        name: "Sensors",
        imagePath: "/pressure-temperature-control/sensors.jpeg",
        quantity: undefined
      },
      {
        name: "Thermocouples",
        imagePath: "/pressure-temperature-control/thermocouples.jpg",
        quantity: undefined
      },
      {
        name: "Thermometers",
        imagePath: "/pressure-temperature-control/thermometer.jpg",
        quantity: undefined
      },
      {
        name: "Transducers",
        imagePath: "/pressure-temperature-control/transducers.jpg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Pulling & Lifting",
    slug: toSlug("Pulling & Lifting"),
    items: [
      {
        name: "Chain", imagePath: "/pulling-lifting/chain.jpg",
        quantity: undefined
      },
      {
        name: "Clamps", imagePath: "/pulling-lifting/clamps.jpg",
        quantity: undefined
      },
      // { name: "Eye Bolts", imagePath: "/pulling-lifting/eye-bolts.webp" },
      {
        name: "Hoists", imagePath: "/pulling-lifting/hoists.jpeg",
        quantity: undefined
      },
      {
        name: "Hooks", imagePath: "/pulling-lifting/hooks.avif",
        quantity: undefined
      },
      {
        name: "Rope", imagePath: "/pulling-lifting/rope.jpg",
        quantity: undefined
      },
      {
        name: "Shackles", imagePath: "/pulling-lifting/shackles.webp",
        quantity: undefined
      },
      {
        name: "Slings", imagePath: "/pulling-lifting/slings.jpg",
        quantity: undefined
      },
      {
        name: "Turnbuckles", imagePath: "/pulling-lifting/turnbuckles.jpg",
        quantity: undefined
      },
      {
        name: "Winches", imagePath: "/pulling-lifting/winches.jpg",
        quantity: undefined
      },
      {
        name: "Wire Rope", imagePath: "/pulling-lifting/wire-rope.jpeg",
        quantity: undefined
      },
    ],
  },
  {
    title: "Raw Materials",
    slug: toSlug("Raw Materials"),
    items: [
      {
        name: "Ceramics", imagePath: "/raw-materials/ceramics.jpg",
        quantity: undefined
      },
      {
        name: "Fabrics", imagePath: "/raw-materials/fabrics.jpg",
        quantity: undefined
      },
      {
        name: "Felt", imagePath: "/raw-materials/felt.webp",
        quantity: undefined
      },
      {
        name: "Fiberglass", imagePath: "/raw-materials/fiberglass.jpg",
        quantity: undefined
      },
      {
        name: "Foam", imagePath: "/raw-materials/foam.jpg",
        quantity: undefined
      },
      {
        name: "Glass", imagePath: "/raw-materials/glass.jpg",
        quantity: undefined
      },
      {
        name: "Metals", imagePath: "/raw-materials/metals.jpg",
        quantity: undefined
      },
      {
        name: "Plastics", imagePath: "/raw-materials/plastic.webp",
        quantity: undefined
      },
      {
        name: "Rubber", imagePath: "/raw-materials/rubber.webp",
        quantity: undefined
      },
      {
        name: "Wood", imagePath: "/raw-materials/wood.webp",
        quantity: undefined
      },
    ],
  },
  
 
 
 
 
];

// Helper to get simple list of names for the Sidebar
export const SIDEBAR_LINKS = INVENTORY_DATA.map((cat) => cat.title).sort();
