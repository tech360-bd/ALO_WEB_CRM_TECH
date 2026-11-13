import type { TopicAreaSeed } from './catalogue-types';

/**
 * Engineering topic catalogue. Categories only — not a claim that a named
 * institution, laboratory or supervisor can support them. Every candidate is
 * generated with provisional status and explicit resource requirements.
 */
export const ENGINEERING_TOPIC_AREAS: TopicAreaSeed[] = [
  {
    code: 'ENG-RENEWABLE-ENERGY',
    discipline: 'ENGINEERING',
    name: 'Renewable energy and energy systems',
    subfield: 'Energy engineering',
    summary:
      'Design, integration, control and assessment of renewable generation, storage and flexible energy systems.',
    keywords: ['renewable energy', 'energy storage', 'grid integration', 'photovoltaics', 'wind', 'energy systems'],
    problems: [
      {
        id: 'storage-integration',
        statement:
          'High renewable penetration creates mismatch between variable generation and demand that storage and flexibility measures only partly resolve.',
        plain:
          'Sun and wind do not follow demand. How can storage and flexibility keep the system reliable and affordable?',
        evidence:
          'Evidence route: official system-operator data, published energy-system models and peer-reviewed integration studies.',
        question:
          'How can hybrid storage and demand-flexibility strategies maintain system reliability at high renewable penetration?',
      },
      {
        id: 'pv-degradation',
        statement:
          'Photovoltaic performance degradation under real operating conditions remains difficult to predict, affecting lifetime yield and investment decisions.',
        plain:
          'Solar panels lose output over time, but by how much and why under real weather and soiling?',
        evidence:
          'Evidence route: monitored PV plant data, accelerated-ageing studies and manufacturer warranties (treated as claims, not proof).',
        question:
          'Which degradation mechanisms dominate photovoltaic output loss under specific UK operating conditions, and how can they be modelled?',
      },
    ],
    theories: ['Energy-system optimisation', 'Reliability theory', 'Thermodynamics and heat transfer', 'Life-cycle assessment'],
    methods: ['NUMERICAL_SIMULATION', 'FIELD_MEASUREMENT', 'LAB_EXPERIMENT', 'RELIABILITY_OPTIMISATION'],
    dataSources: 'System-operator time series, monitored plant data, laboratory measurements, weather records.',
    risks: 'Equipment access; long measurement periods; data quality; model validation limits.',
    ethics: 'Electrical safety, responsible data handling, transparent model assumptions, environmental compliance for field work.',
    contributions: 'A validated model or control strategy improving renewable integration or lifetime prediction, with quantified uncertainty.',
    searchStrategy:
      'Search Scopus, IEEE Xplore and Web of Science for (renewable OR photovoltaic) AND (integration OR degradation OR storage), plus official system-operator and energy-statistics publications.',
  },
  {
    code: 'ENG-ELECTRICAL-POWER',
    discipline: 'ENGINEERING',
    name: 'Electrical engineering and power electronics',
    subfield: 'Electrical / power engineering',
    summary:
      'Power-electronic conversion, electrical machines, drives and control for efficient, resilient electrification.',
    keywords: ['power electronics', 'electric machines', 'converters', 'motor drives', 'grid', 'control'],
    problems: [
      {
        id: 'converter-efficiency',
        statement:
          'Wide-bandgap power converters offer efficiency gains but raise thermal-management and electromagnetic-interference challenges in compact systems.',
        plain:
          'New fast power switches save energy but run hot and interfere with nearby electronics. How can both be managed?',
        evidence:
          'Evidence route: device datasheets and application notes (claims from manufacturers), peer-reviewed converter studies and measured prototypes.',
        question:
          'How can thermal and electromagnetic performance be co-designed in compact wide-bandgap power converters?',
      },
      {
        id: 'machine-reliability',
        statement:
          'Condition monitoring of electrical machines often detects faults too late for cost-effective intervention.',
        plain:
          'Motors fail unexpectedly. Can early warning be made reliable and practical?',
        evidence:
          'Evidence route: measured machine data, industry maintenance records and fault-diagnosis literature.',
        question:
          'Which low-cost sensing and signal features provide early, reliable detection of incipient machine faults?',
      },
    ],
    theories: ['Electromagnetic field theory', 'Control theory', 'Reliability engineering', 'Thermal management'],
    methods: ['LAB_EXPERIMENT', 'PROTOTYPE_VALIDATION', 'NUMERICAL_SIMULATION', 'BENCHMARKING'],
    dataSources: 'Prototype measurements, manufacturer datasheets, test-bench instrumentation, simulation output.',
    risks: 'High-voltage safety, equipment lead times, component variability, limited test-bench time.',
    ethics: 'Electrical safety protocols, proper PPE, certified equipment, disposal of hazardous materials, honest reporting of failed trials.',
    contributions: 'A validated design, sensing method or control strategy with quantified performance under realistic operating conditions.',
    searchStrategy:
      'Search IEEE Xplore, Scopus and Web of Science for (wide-bandgap OR SiC OR GaN) AND (converter OR "condition monitoring") AND (thermal OR EMI), plus manufacturer application notes used only as manufacturer claims.',
  },
  {
    code: 'ENG-CIVIL-STRUCTURAL',
    discipline: 'ENGINEERING',
    name: 'Civil, structural and construction engineering',
    subfield: 'Civil / structural engineering',
    summary:
      'Resilience, retrofit and whole-life performance of structures and construction processes under environmental and loading uncertainty.',
    keywords: ['structural resilience', 'retrofit', 'construction', 'whole-life', 'flood', 'infrastructure'],
    problems: [
      {
        id: 'retrofit-performance',
        statement:
          'Retrofit of ageing structures for changed loads and climate exposure lacks validated, scalable design approaches.',
        plain:
          'Older buildings and bridges need strengthening. Which retrofit methods work reliably and affordably?',
        evidence:
          'Evidence route: design codes, monitoring data, laboratory tests and documented retrofit cases.',
        question:
          'Which retrofit configurations provide reliable structural performance under projected loading and exposure changes?',
      },
      {
        id: 'construction-productivity',
        statement:
          'Construction’s productivity and carbon performance are constrained by fragmented information and late design decisions.',
        plain:
          'Construction is slow and wasteful partly because decisions are made too late. What changes that?',
        evidence:
          'Evidence route: project datasets, industry productivity reports and documented process interventions.',
        question:
          'How do information-flow and decision-timing interventions affect construction productivity and embodied carbon?',
      },
    ],
    theories: ['Structural reliability', 'Resilience engineering', 'Lean construction', 'Life-cycle assessment'],
    methods: ['FEA_CFD', 'LAB_EXPERIMENT', 'FIELD_MEASUREMENT', 'CASE_STUDY'],
    dataSources: 'Structural monitoring, laboratory tests, project records under agreement, code-compliant design models.',
    risks: 'Access to sites and structures; safety; modelling assumptions; data incompleteness.',
    ethics: 'Site safety, structural competence, third-party risk, data confidentiality, environmental controls.',
    contributions: 'A validated retrofit design approach or evidence-based process intervention with quantified performance.',
    searchStrategy:
      'Search Scopus, Web of Science and ICE Virtual Library for (retrofit OR "structural resilience") AND (testing OR monitoring OR "whole life"), plus national design codes and infrastructure statistics.',
  },
  {
    code: 'ENG-MECHANICAL-MANUFACTURING',
    discipline: 'ENGINEERING',
    name: 'Mechanical engineering and advanced manufacturing',
    subfield: 'Mechanical / manufacturing',
    summary:
      'Process–structure–property relationships in manufacturing, metrology, tribology and machine performance.',
    keywords: ['advanced manufacturing', 'additive manufacturing', 'machining', 'tribology', 'metrology', 'process optimisation'],
    problems: [
      {
        id: 'am-quality',
        statement:
          'Additive manufacturing produces property variability that limits certification for safety-critical parts.',
        plain:
          '3D-printed metal parts can vary in strength. How can quality be predicted and controlled?',
        evidence:
          'Evidence route: measured build data, standards, post-build testing and peer-reviewed AM studies.',
        question:
          'Which in-process signatures predict mechanical property variability in metal additive manufacturing sufficiently for certification?',
      },
      {
        id: 'surface-wear',
        statement:
          'Wear and friction losses in mechanical systems remain difficult to predict for new material pairs and lubricants.',
        plain:
          'Moving parts wear out unpredictably. Can wear be predicted well enough to design longer-lasting machines?',
        evidence:
          'Evidence route: tribometer experiments, field wear data and physics-based wear models.',
        question:
          'How can tribological testing and modelling be combined to predict wear for candidate material–lubricant pairs?',
      },
    ],
    theories: ['Materials mechanics', 'Tribology', 'Design for manufacture', 'Statistical process control'],
    methods: ['LAB_EXPERIMENT', 'PROTOTYPE_VALIDATION', 'MATERIALS_CHARACTERISATION', 'NUMERICAL_SIMULATION'],
    dataSources: 'Test-bench measurements, metrology, material characterisation, machine logs.',
    risks: 'Machine time, material costs, sample size, laboratory safety.',
    ethics: 'Machinery safety, chemical handling, data integrity, responsible reporting of negative results.',
    contributions: 'A validated process–property model or design method with quantified uncertainty and transferability limits.',
    searchStrategy:
      'Search Scopus, Web of Science and ScienceDirect for ("additive manufacturing" OR tribology) AND (quality OR wear) AND (measurement OR prediction), plus ISO/ASTM standards.',
  },
  {
    code: 'ENG-MATERIALS-CORROSION',
    discipline: 'ENGINEERING',
    name: 'Materials science, corrosion and surface engineering',
    subfield: 'Materials engineering',
    summary:
      'Degradation mechanisms, protective surfaces and material selection for durable, sustainable engineering assets.',
    keywords: ['corrosion', 'surface engineering', 'coatings', 'materials characterisation', 'durability', 'hydrogen embrittlement'],
    problems: [
      {
        id: 'coating-durability',
        statement:
          'Protective coatings often fail earlier in service than accelerated tests predict, especially under combined mechanical and chemical loading.',
        plain:
          'Coatings pass lab tests but fail in the field. What is missing from the tests?',
        evidence:
          'Evidence route: field exposure data, standardised accelerated tests and characterisation of failed samples.',
        question:
          'How can combined mechanical–chemical exposure be represented in accelerated testing to predict coating durability?',
      },
      {
        id: 'hydrogen-embrittlement',
        statement:
          'Hydrogen embrittlement threatens the integrity of steels used in energy infrastructure, but susceptibility varies with microstructure and environment.',
        plain:
          'Hydrogen can make strong steel brittle. Which microstructures and conditions are most at risk?',
        evidence:
          'Evidence route: mechanical testing, fractography, electrochemical measurements and peer-reviewed studies.',
        question:
          'Which microstructural features control hydrogen-embrittlement susceptibility in candidate infrastructure steels?',
      },
    ],
    theories: ['Electrochemistry', 'Fracture mechanics', 'Diffusion theory', 'Surface science'],
    methods: ['LAB_EXPERIMENT', 'MATERIALS_CHARACTERISATION', 'NUMERICAL_SIMULATION', 'FIELD_MEASUREMENT'],
    dataSources: 'Electrochemical and mechanical test data, microscopy, field exposure coupons, material specifications.',
    risks: 'Laboratory access, hazardous chemicals, specimen variability, long exposure times.',
    ethics: 'Chemical safety, waste handling, equipment competence, transparent reporting of specimen exclusions.',
    contributions: 'A mechanistic account linking microstructure or exposure to degradation, with an improved test methodology.',
    searchStrategy:
      'Search Scopus, Web of Science and NACE/AMPP resources for (corrosion OR "hydrogen embrittlement") AND (coating OR microstructure) AND (testing OR characterisation).',
  },
  {
    code: 'ENG-ROBOTICS-CONTROL',
    discipline: 'ENGINEERING',
    name: 'Robotics, control systems and automation',
    subfield: 'Robotics / control',
    summary:
      'Perception, planning and control for robots operating safely in uncertain, human-shared environments.',
    keywords: ['robotics', 'control systems', 'automation', 'perception', 'human-robot interaction', 'safety'],
    problems: [
      {
        id: 'safe-navigation',
        statement:
          'Robots that navigate crowded human spaces often lack certified, interpretable safety guarantees.',
        plain:
          'Robots move among people. How can their safety be guaranteed and understood?',
        evidence:
          'Evidence route: safety standards, measured robot trials and peer-reviewed control and perception research.',
        question:
          'Which control architectures provide verifiable safety guarantees for robots operating near people?',
      },
      {
        id: 'hri-trust',
        statement:
          'Trust in automated systems is poorly calibrated, leading to both misuse and disuse in operational settings.',
        plain:
          'People trust automation too much or too little. How should systems communicate confidence?',
        evidence:
          'Evidence route: human-factors experiments, field deployment data and incident reports.',
        question:
          'How should automated systems communicate uncertainty to support calibrated operator trust?',
      },
    ],
    theories: ['Control theory', 'Probabilistic robotics', 'Human-automation interaction', 'Formal verification'],
    methods: ['PROTOTYPE_VALIDATION', 'LAB_EXPERIMENT', 'NUMERICAL_SIMULATION', 'CONTROL_SYSTEM'],
    dataSources: 'Robot sensor logs, controlled trial data, simulation environments, operator responses.',
    risks: 'Equipment availability, integration complexity, human-subject approval, safety case requirements.',
    ethics: 'Research-ethics approval for human participants, robot safety, privacy of sensor data, no deployment without risk assessment.',
    contributions: 'A verifiable control or interaction method with measured safety, performance and trust outcomes.',
    searchStrategy:
      'Search IEEE Xplore, Scopus and ACM DL for (safe robotics OR "human-robot") AND (control OR trust OR uncertainty), plus relevant ISO/IEC safety standards.',
  },
  {
    code: 'ENG-CHEMICAL-PROCESS',
    discipline: 'ENGINEERING',
    name: 'Chemical, process and environmental engineering',
    subfield: 'Chemical / process engineering',
    summary:
      'Process intensification, separation and reaction engineering for lower-energy, lower-emission production.',
    keywords: ['process intensification', 'reaction engineering', 'separation', 'decarbonisation', 'scale-up', 'catalysis'],
    problems: [
      {
        id: 'process-intensification',
        statement:
          'Promising intensified reactors are difficult to scale because heat and mass transfer behaviour changes non-linearly with scale.',
        plain:
          'Lab reactors work well but full-size plants behave differently. How can scale-up be predicted?',
        evidence:
          'Evidence route: pilot-plant data, computational fluid dynamics and peer-reviewed scale-up studies.',
        question:
          'Which scale-up models reliably predict heat and mass transfer in intensified reactors across pilot scales?',
      },
      {
        id: 'solvent-recovery',
        statement:
          'Solvent recovery and separation remain major energy users in chemical processes, constraining decarbonisation.',
        plain:
          'Separating chemicals uses enormous energy. Which recovery designs cut energy without harming purity?',
        evidence:
          'Evidence route: process simulation, plant energy data and peer-reviewed separation studies.',
        question:
          'How can hybrid separation and solvent-recovery configurations reduce process energy demand while meeting purity requirements?',
      },
    ],
    theories: ['Transport phenomena', 'Reaction kinetics', 'Thermodynamics', 'Process systems engineering'],
    methods: ['LAB_EXPERIMENT', 'NUMERICAL_SIMULATION', 'PROTOTYPE_VALIDATION', 'RELIABILITY_OPTIMISATION'],
    dataSources: 'Experimental kinetics, pilot-plant measurements, process simulation, plant utilities data.',
    risks: 'Hazardous materials, pilot-plant access, computational resources, scale-up uncertainty.',
    ethics: 'Process safety (HAZOP), chemical handling, environmental permits, emergency planning.',
    contributions: 'Validated scale-up or separation design guidance with quantified energy and purity trade-offs.',
    searchStrategy:
      'Search Scopus, Web of Science and IChemE resources for ("process intensification" OR "solvent recovery") AND (scale-up OR energy), plus process-safety guidance.',
  },
  {
    code: 'ENG-WATER-CLIMATE',
    discipline: 'ENGINEERING',
    name: 'Water, infrastructure and climate resilience',
    subfield: 'Water / environmental engineering',
    summary:
      'Water treatment, drainage and infrastructure adaptation under changing rainfall, demand and water-quality pressures.',
    keywords: ['water treatment', 'flood resilience', 'drainage', 'water quality', 'climate adaptation', 'infrastructure'],
    problems: [
      {
        id: 'nature-based-drainage',
        statement:
          'Nature-based drainage interventions perform inconsistently across soil, catchment and maintenance conditions.',
        plain:
          'Green drains and wetlands can reduce flooding, but not everywhere. What determines success?',
        evidence:
          'Evidence route: monitored catchment data, maintenance records and peer-reviewed hydrological studies.',
        question:
          'Which design and maintenance factors determine the hydrological performance of nature-based drainage?',
      },
      {
        id: 'treatment-resilience',
        statement:
          'Water-treatment processes are vulnerable to source-water quality shocks and energy constraints.',
        plain:
          'Treatment works must cope with sudden pollution and power limits. How can they stay reliable?',
        evidence:
          'Evidence route: utility operating data, regulatory water-quality records and bench/pilot testing.',
        question:
          'How can treatment process design and control improve resilience to combined source-quality and energy shocks?',
      },
    ],
    theories: ['Hydrology', 'Reliability and resilience theory', 'Environmental chemistry', 'Risk analysis'],
    methods: ['FIELD_MEASUREMENT', 'NUMERICAL_SIMULATION', 'LAB_EXPERIMENT', 'CASE_STUDY'],
    dataSources: 'Catchment monitoring, utility operational data, regulatory water-quality datasets, rainfall records.',
    risks: 'Site access, weather dependence, data licences, seasonal variability.',
    ethics: 'Environmental protection, public-health safeguards, consent for site access, responsible data sharing.',
    contributions: 'Evidence on design/maintenance determinants or a validated resilience assessment method for water infrastructure.',
    searchStrategy:
      'Search Scopus, Web of Science and IWA resources for ("nature-based" OR "water treatment") AND (resilience OR "water quality"), plus regulator and MET Office datasets.',
  },
  {
    code: 'ENG-COMPUTATIONAL-MODELLING',
    discipline: 'ENGINEERING',
    name: 'Computational engineering and numerical modelling',
    subfield: 'Computational engineering',
    summary:
      'Numerical methods, uncertainty quantification and simulation validation for engineering decision-making.',
    keywords: ['finite element', 'CFD', 'numerical modelling', 'uncertainty quantification', 'validation', 'simulation'],
    problems: [
      {
        id: 'uq-validation',
        statement:
          'Engineering simulations are often presented with point predictions rather than calibrated uncertainty, limiting decision value.',
        plain:
          'Simulation gives one number, but how reliable is it? Can uncertainty be quantified properly?',
        evidence:
          'Evidence route: verification-and-validation standards, benchmark problems and peer-reviewed UQ methods.',
        question:
          'How can uncertainty quantification be embedded in engineering simulation workflows without making them impractical?',
      },
      {
        id: 'surrogate-fidelity',
        statement:
          'Surrogate models accelerate design exploration but can fail silently outside their training domain.',
        plain:
          'Fast approximate models can be wrong in new situations. How can that be detected?',
        evidence:
          'Evidence route: benchmark datasets, cross-validation studies and documented surrogate failures.',
        question:
          'Which practical out-of-distribution checks make surrogate models safe for engineering design decisions?',
      },
    ],
    theories: ['Numerical analysis', 'Verification and validation', 'Bayesian inference', 'Model-form uncertainty'],
    methods: ['NUMERICAL_SIMULATION', 'FEA_CFD', 'BENCHMARKING', 'MIXED_COMPUTATIONAL_EXPERIMENTAL'],
    dataSources: 'Benchmark problems, high-fidelity simulations, experimental validation data, HPC resources.',
    risks: 'Compute limits, validation data scarcity, model complexity, reproducibility.',
    ethics: 'Reproducible code and data, transparent assumptions, responsible HPC use, licensing compliance.',
    contributions: 'A practical UQ or validation method with demonstrated benefit on an engineering benchmark and real case.',
    searchStrategy:
      'Search Scopus, Web of Science and SIAM/ASME resources for ("uncertainty quantification" OR "surrogate model") AND (validation OR "out-of-distribution") AND engineering.',
  },
  {
    code: 'ENG-AI-ENGINEERING',
    discipline: 'ENGINEERING',
    name: 'Artificial intelligence applied to engineering',
    subfield: 'Engineering AI / data-driven methods',
    summary:
      'Machine learning for monitoring, design and control, with attention to data scarcity, safety and deployment constraints.',
    keywords: ['machine learning', 'engineering AI', 'condition monitoring', 'predictive maintenance', 'digital twin', 'safety'],
    problems: [
      {
        id: 'data-scarcity',
        statement:
          'Engineering failure data are scarce and imbalanced, making supervised failure prediction unreliable.',
        plain:
          'Machines rarely fail, so there is little failure data to learn from. How can prediction still work?',
        evidence:
          'Evidence route: industrial datasets under agreement, run-to-failure benchmarks and peer-reviewed methods.',
        question:
          'Which learning strategies produce reliable failure prediction under severe class imbalance in engineering systems?',
      },
      {
        id: 'digital-twin-assurance',
        statement:
          'Digital twins are increasingly used for operational decisions without agreed assurance methods for their predictions.',
        plain:
          'A digital copy of a machine informs real decisions. How do we know when it can be trusted?',
        evidence:
          'Evidence route: documented deployments, assurance frameworks and measured twin-versus-asset performance.',
        question:
          'What assurance evidence is required before digital-twin predictions can support safety-relevant engineering decisions?',
      },
    ],
    theories: ['Statistical learning theory', 'Reliability engineering', 'Control theory', 'Assurance cases'],
    methods: ['NUMERICAL_SIMULATION', 'BENCHMARKING', 'FIELD_MEASUREMENT', 'MIXED_COMPUTATIONAL_EXPERIMENTAL'],
    dataSources: 'Sensor time series, maintenance records, simulation-generated data, benchmark datasets.',
    risks: 'Data access and quality, label noise, deployment shift, compute cost.',
    ethics: 'Data governance, safety assurance, transparency, no use of personal data without consent, reproducibility.',
    contributions: 'A validated method or assurance framework with demonstrated performance under realistic engineering constraints.',
    searchStrategy:
      'Search IEEE Xplore, Scopus and Web of Science for ("predictive maintenance" OR "digital twin") AND (imbalance OR assurance), plus relevant safety-assurance guidance.',
  },
  {
    code: 'ENG-INDUSTRIAL-OPTIMISATION',
    discipline: 'ENGINEERING',
    name: 'Industrial systems, optimisation and reliability',
    subfield: 'Industrial engineering',
    summary:
      'Optimisation, maintenance and reliability modelling for productive, safe and sustainable industrial systems.',
    keywords: ['optimisation', 'reliability', 'maintenance', 'scheduling', 'operations research', 'digital twin'],
    problems: [
      {
        id: 'maintenance-scheduling',
        statement:
          'Maintenance scheduling that ignores production and supply constraints produces avoidable downtime and cost.',
        plain:
          'Maintenance plans often clash with production. Can scheduling optimise both?',
        evidence:
          'Evidence route: plant maintenance and production records, optimisation literature and documented implementations.',
        question:
          'How can maintenance and production scheduling be jointly optimised under realistic resource and uncertainty constraints?',
      },
      {
        id: 'reliability-degradation',
        statement:
          'Reliability models calibrated on historical failure data may not transfer to new operating regimes or asset fleets.',
        plain:
          'Failure predictions from old machines may not fit new ones. How can reliability models adapt?',
        evidence:
          'Evidence route: fleet failure data, operating-condition records and validation studies.',
        question:
          'Which degradation-aware reliability models remain valid when operating regimes change?',
      },
    ],
    theories: ['Operations research', 'Reliability theory', 'Queueing and scheduling', 'Multi-objective optimisation'],
    methods: ['RELIABILITY_OPTIMISATION', 'NUMERICAL_SIMULATION', 'BENCHMARKING', 'FIELD_MEASUREMENT'],
    dataSources: 'Maintenance logs, production schedules, sensor data, cost records.',
    risks: 'Data access, model assumptions, organisational constraints, implementation barriers.',
    ethics: 'Worker safety, data confidentiality, transparent optimisation objectives, consideration of job impacts.',
    contributions: 'A validated optimisation or reliability method with quantified operational benefit and implementation requirements.',
    searchStrategy:
      'Search Scopus, Web of Science and IEEE Xplore for (maintenance scheduling OR "reliability model") AND (optimisation OR degradation OR uncertainty), plus asset-management standards.',
  },
  {
    code: 'ENG-SUSTAINABLE-CIRCULAR',
    discipline: 'ENGINEERING',
    name: 'Sustainable engineering and circular manufacturing',
    subfield: 'Sustainable engineering',
    summary:
      'Life-cycle performance, material recovery and circular design for lower-impact manufacturing and products.',
    keywords: ['circular economy', 'life-cycle assessment', 'remanufacturing', 'material recovery', 'sustainability', 'design for disassembly'],
    problems: [
      {
        id: 'circular-tradeoffs',
        statement:
          'Circular strategies can reduce material use while increasing processing energy or transport, producing uncertain net benefits.',
        plain:
          'Recycling and remanufacturing are not automatically greener. When do they actually help?',
        evidence:
          'Evidence route: life-cycle inventories, process energy measurements and peer-reviewed LCA studies.',
        question:
          'Under which conditions do circular manufacturing strategies deliver net environmental benefits across the product life cycle?',
      },
      {
        id: 'disassembly-design',
        statement:
          'Products are rarely designed for economic disassembly, limiting high-value material recovery at end of life.',
        plain:
          'Products are hard to take apart, so valuable materials are lost. What design changes fix that?',
        evidence:
          'Evidence route: disassembly trials, cost data, product teardowns and design guidance.',
        question:
          'Which design-for-disassembly choices improve high-value recovery while remaining commercially viable to manufacture?',
      },
    ],
    theories: ['Life-cycle assessment', 'Circular economy frameworks', 'Design for sustainability', 'Material flow analysis'],
    methods: ['LAB_EXPERIMENT', 'RELIABILITY_OPTIMISATION', 'CASE_STUDY', 'MATERIALS_CHARACTERISATION'],
    dataSources: 'Life-cycle inventories, process measurements, product teardown data, industry cost records.',
    risks: 'LCA data quality, system-boundary sensitivity, commercial data access.',
    ethics: 'Transparent boundaries and assumptions, avoidance of greenwashing, worker safety in disassembly trials, waste regulations.',
    contributions: 'Evidence on circular-strategy trade-offs or a validated design method with quantified life-cycle benefits.',
    searchStrategy:
      'Search Scopus, Web of Science and ScienceDirect for ("circular economy" OR "design for disassembly") AND ("life cycle assessment" OR recovery), plus official LCA databases and waste regulations.',
  },
];
