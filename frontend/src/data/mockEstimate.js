const generateMockEstimate = () => ({
  _id: "mock-" + Date.now(),
  documentName: "Sample Road Safety Intervention Report.pdf",
  status: "completed",
  createdAt: new Date().toISOString(),
  totalMaterialCost: 2847500,
  interventions: [
    {
      name: "Installation of Road Safety Signage",
      description:
        "Installation of regulatory, warning, and informatory signs as per IRC:67-2012",
      quantity: 45,
      unit: "nos",
    },
    {
      name: "Road Markings and Delineators",
      description:
        "Thermoplastic road markings and cat-eye reflectors as per IRC:35-2015",
      quantity: 850,
      unit: "sqm",
    },
    {
      name: "Guard Rails Installation",
      description: "W-Beam metal beam crash barriers as per IRC:SP:84-2014",
      quantity: 320,
      unit: "meter",
    },
    {
      name: "Speed Calming Measures",
      description: "Speed breakers and rumble strips as per IRC:99-2018",
      quantity: 12,
      unit: "nos",
    },
  ],
  materialEstimates: [
    {
      intervention: "Installation of Road Safety Signage",
      totalCost: 675000,
      items: [
        {
          itemName: "Regulatory Sign Boards (600mm x 600mm)",
          specification:
            "Retro-reflective Grade III with aluminum sheet 2mm thick",
          quantity: 25,
          unit: "nos",
          unitPrice: 15000,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Warning Sign Boards (900mm Triangle)",
          specification:
            "Retro-reflective Grade III with aluminum sheet 2mm thick",
          quantity: 15,
          unit: "nos",
          unitPrice: 18000,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Informatory Sign Boards (1200mm x 600mm)",
          specification:
            "Retro-reflective Grade III with aluminum sheet 2mm thick",
          quantity: 5,
          unit: "nos",
          unitPrice: 21000,
          source: "GeM Portal",
        },
      ],
      rationale:
        "As per IRC:67-2012, regulatory signs ensure compliance with traffic rules, warning signs alert drivers to hazards, and informatory signs provide guidance. Grade III retro-reflective material ensures visibility in all lighting conditions. Material quantities calculated based on standard spacing requirements of 50-100m intervals for urban roads.",
    },
    {
      intervention: "Road Markings and Delineators",
      totalCost: 1147500,
      items: [
        {
          itemName: "Thermoplastic Road Marking Paint (White)",
          specification: "3mm thick, hot applied, conforming to IS:9862",
          quantity: 500,
          unit: "sqm",
          unitPrice: 850,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Thermoplastic Road Marking Paint (Yellow)",
          specification: "3mm thick, hot applied, conforming to IS:9862",
          quantity: 250,
          unit: "sqm",
          unitPrice: 900,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Cat-Eye Road Studs (Bi-directional)",
          specification: "Retro-reflective with epoxy adhesive",
          quantity: 100,
          unit: "nos",
          unitPrice: 2250,
          source: "GeM Portal",
        },
      ],
      rationale:
        "IRC:35-2015 specifies thermoplastic markings for durability (3-5 years life). White lines for lane demarcation, yellow for center lines and no-parking zones. Cat-eye studs at 10m intervals enhance nighttime visibility. Material coverage: 1 sqm covers approximately 10m of 100mm wide line.",
    },
    {
      intervention: "Guard Rails Installation",
      totalCost: 800000,
      items: [
        {
          itemName: "W-Beam Metal Beam Crash Barrier",
          specification: "Galvanized steel conforming to IRC:SP:84-2014",
          quantity: 320,
          unit: "meter",
          unitPrice: 2200,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Crash Barrier Posts (150mm dia)",
          specification: "MS pipe with concrete foundation",
          quantity: 80,
          unit: "nos",
          unitPrice: 1800,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Anchor Bolts and Fasteners",
          specification: "Grade 8.8 bolts with nuts and washers",
          quantity: 320,
          unit: "set",
          unitPrice: 150,
          source: "GeM Portal",
        },
      ],
      rationale:
        "IRC:SP:84-2014 mandates W-beam barriers for containment levels N2/H2. Post spacing of 4m ensures structural integrity. Galvanized finish provides corrosion resistance. Installation at curve sections, embankments, and bridge approaches as per safety audit recommendations.",
    },
    {
      intervention: "Speed Calming Measures",
      totalCost: 225000,
      items: [
        {
          itemName: "Prefabricated Speed Breaker (3.5m width)",
          specification: "Rubber/plastic with retro-reflective markings",
          quantity: 8,
          unit: "nos",
          unitPrice: 18500,
          source: "GeM Portal",
        },
        {
          itemName: "Rumble Strip Installation",
          specification: "Thermoplastic material, 300mm width",
          quantity: 4,
          unit: "location",
          unitPrice: 22500,
          source: "CPWD SOR 2024",
        },
        {
          itemName: "Speed Limit Sign Board (Mandatory)",
          specification: "600mm dia, Retro-reflective Grade III",
          quantity: 12,
          unit: "nos",
          unitPrice: 3500,
          source: "CPWD SOR 2024",
        },
      ],
      rationale:
        "IRC:99-2018 recommends speed breakers at sensitive locations (schools, hospitals, residential areas). Maximum height 100mm with gradual slopes. Rumble strips 50m before breakers for advance warning. Speed limit signage at 50m intervals to enforce compliance. Installation spacing: 150-200m in built-up areas.",
    },
  ],
});

export const storeMockEstimate = (id, estimate) => {
  try {
    localStorage.setItem(`mock-estimate-${id}`, JSON.stringify(estimate));
  } catch (e) {
    console.error("Failed to store mock estimate:", e);
  }
};

export const getMockEstimateById = (id) => {
  try {
    const stored = localStorage.getItem(`mock-estimate-${id}`);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to retrieve mock estimate:", e);
    return null;
  }
};

export const getMockEstimate = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const estimate = generateMockEstimate();
      const estimateId = estimate._id;

      storeMockEstimate(estimateId, estimate);

      resolve({
        data: {
          success: true,
          message: "File uploaded and processed successfully (DEMO MODE)",
          data: {
            estimateId: estimateId,
            estimate: estimate,
          },
        },
      });
    }, 2000);
  });
};
