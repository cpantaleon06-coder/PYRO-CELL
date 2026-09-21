# PYRO-CELL

## Inspiration

Sargassum influxes have severely impacted Caribbean ecosystems and coastal economies. Traditional disposal involves landfilling or dumping, which creates secondary pollution and wastes a high-potential biomass source. Inspired by circular economy principles, our team set out to model and visualize a continuous, autothermal valorization pipeline. By transforming raw, wet sargassum into high-value biochar, bio-oil, and syngas, we can turn an environmental crisis into an economically viable and energy-positive industry.

## What it does

We designed a client-side simulation dashboard split into 5 core modules, backed by mathematical and physical balances verified against peer-reviewed research (Milledge et al. 2015 and Cheatham et al. 2026).

```
[ 1. Sea Harvesting ] → [ 2. Mechanical Centrifuge ] → [ 3. Honeycomb Solar Dryer ]
   (82% MOISTURE)            (60% MOISTURE)                  (20% MOISTURE)
```

## How we built it

We designed and simulated the entire processing pipeline using custom MATLAB modeling tools. The system breaks down the transformation into four interconnected stages:

- **Sea Harvesting:** Collecting raw sargassum with high natural moisture content directly from coastal waters.
- **Mechanical Centrifuge Dewatering:** Using centrifugal force to rapidly extract free seawater from the biomass without relying on thermal energy.
- **Honeycomb Solar Mesh Drying:** Spreading the partially dewatered algae onto perforated mesh beds inside a passive greenhouse structure to evaporate residual water using solar radiation.
- **Pyrolysis Furnace Reactor:** Feeding the pre-conditioned, dry sargassum into a continuous tubular reactor to thermally decompose it into carbonized biochar and energy-rich gases.

We built an interactive, two-dimensional thermal simulation to model the heat distribution inside the furnace reactor, as well as an animated visualization that tracks biomass particles as they transform from raw green algae into carbonized biochar.

## Challenges we ran into

- **Balancing Thermal Energy Loads:** Removing high amounts of moisture using heat alone requires massive energy inputs. Designing a pipeline that relies on mechanical dewatering and solar drying prior to thermal processing was crucial to keep the system energy-positive.
- **Continuous Flow Modeling:** Simulating the continuous motion of biomass particles through changing thermal gradients required careful tracking of material state transitions inside MATLAB.
- **Recirculation Integration:** Modeling the autothermal loop—where syngas generated during pyrolysis is recirculated to power the furnace burners—required balancing energy yields with reactor heat demand.

## Accomplishments that we're proud of

- **Integrated 2D Thermal Visualization:** Successfully rendered a real-time thermal map of the reactor interior alongside an animated particle flow representing biomass conversion.
- **Complete Pipeline Simulation:** Built a modular simulation covering every stage from wet sea harvesting to final biochar collection.
- **Autothermal Energy Balance:** Demonstrated that energy recovered from pyrolysis gases can sustain reactor heating requirements, making the core conversion step self-sufficient.

## What we learned

- **Pre-treatment is Everything:** Mechanical and solar dewatering steps are far more critical to overall system efficiency than the reactor itself, as removing water passively saves vast amounts of operational energy.
- **Spatial Temperature Gradients Matter:** The radial and axial temperature profiles inside a tubular reactor directly influence how uniformly biomass transforms into high-quality biochar.
- **Process Coupling:** Linking separate physical steps into a single simulation model reveals bottlenecks that wouldn't be visible when studying individual components in isolation.

## What's next for PYRO-CELL

- **Hardware Prototyping:** Transition from MATLAB visual simulations to building a physical scale model of the honeycomb solar bed and continuous rotary furnace.
- **Automated Sensor Integration:** Incorporate real-time temperature and moisture sensor feeds into the control loop to dynamically adjust conveyor speed inside the furnace.
- **Biochar Application Testing:** Analyze the structural properties of the resulting biochar for use in water filtration systems and sustainable concrete additives.
