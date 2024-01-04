  // Graph data
const graph = {
    A: { B: 0.3, I: 0.6 },
    B: { A: 0.3, C: 0.4, K: 0.4 },
    C: { B: 0.4, D: 0.3, L: 0.7 },
    D: { C: 0.3, E: 0.3, M: 0.6 },
    E: { D: 0.3, F: 0.5, N: 0.6 },
    F: { E: 0.5, G: 0.3, O: 0.3 },
    G: { F: 0.3, H: 0.4, P: 0.3 },
    H: { G: 0.4, Q: 0.5 },
    I: { A: 0.6, J: 0.2 },
    J: { I: 0.2, K: 0.3, R: 0.5 },
    K: { B: 0.4, J: 0.3, L: 0.5, S: 0.8 },
    L: { C: 0.7, K: 0.5, M: 0.3, T: 0.4 },
    M: { D: 0.6, L: 0.6, N: 0.4, U: 0.8 },
    N: { E: 0.6, M: 0.4, O: 0.3, V: 1.0 },
    O: { F: 0.3, N: 0.3, P: 0.3, X: 0.3 },
    P: { G: 0.3, O: 0.3, Q: 0.4, Y: 0.3 },
    Q: { H: 0.5, P: 0.4, Z: 0.3 },
    R: { J: 0.5, S: 0.2 },
    S: { K: 0.8, R: 0.2, T: 0.6 },
    T: { L: 0.4, S: 0.6, U: 0.3 },
    U: { M: 0.8, T: 0.3, V: 0.5 },
    V: { N: 1.0, U: 0.5, W: 0.1 },
    W: { V: 0.1, X: 0.7 },
    X: { O: 0.3, W: 0.7, Y: 0.3 },
    Y: { P: 0.3, X: 0.3, Z: 0.3 },
    Z: { Q: 0.3, Y: 0.3 }
};

// Parameters for the Ant Colony Optimization algorithm
const alpha = 1;  // Influence of pheromone trails
const beta = 2;   // Influence of distance
const Q = 100;    // Total amount of pheromone left on the trail by each Ant
const evaporationRate = 0.05; // Evaporation rate of pheromones

// Structure to store pheromone levels on paths
let pheromoneLevels = {};

// Function to get the pheromone level of a path
function getPheromoneLevel(start, end) {
    let pathKey = [start, end].sort().join('-'); // Ensure symmetry
    return pheromoneLevels[pathKey] || 0.1; // Return existing level or default
}

// Function to update the pheromone level on a path
function updatePheromoneLevel(start, end, deposit) {
    let pathKey = [start, end].sort().join('-');
    pheromoneLevels[pathKey] = (pheromoneLevels[pathKey] || 0.1) + deposit;
}

class Ant {
    constructor(startPoint, graph) {
        this.currentLocation = startPoint;
        this.graph = graph;
        this.path = [startPoint];
        this.totalDistance = 0;
    }

    // Function for an Ant to move to the next location
    move() {
        let nextLocation = this.chooseNextLocation();
        this.path.push(nextLocation);
        this.totalDistance += this.graph[this.currentLocation][nextLocation];
        this.currentLocation = nextLocation;
    }

    chooseNextLocation() {
        let currentLocation = this.currentLocation;
        let possibleNextLocations = this.graph[currentLocation];
        let probabilities = [];

        let total = 0;
        for (let location in possibleNextLocations) {
            if (!this.path.includes(location)) { // Avoid revisiting nodes
                let pheromoneLevel = getPheromoneLevel(currentLocation, location);
                let attractiveness = Math.pow(pheromoneLevel, alpha) * Math.pow((1 / possibleNextLocations[location]), beta); // alpha and beta are parameters
                probabilities.push({ location, attractiveness });
                total += attractiveness;
            }
        }

        // Normalize probabilities
        probabilities = probabilities.map(p => ({ location: p.location, probability: p.attractiveness / total }));

        // Roulette wheel selection
        let random = Math.random();
        let cumulativeProbability = 0;
        for (let p of probabilities) {
            cumulativeProbability += p.probability;
            if (random <= cumulativeProbability) {
                return p.location;
            }
        }

        return this.path[this.path.length - 1]; // Fallback to the last location in case of issues
    }

    // Method to lay down pheromones along the path (if applicable)
    layPheromones() {
        let pheromoneDeposit = Q / this.totalDistance;
        for (let i = 0; i < this.path.length - 1; i++) {
            updatePheromoneLevel(this.path[i], this.path[i + 1], pheromoneDeposit);
        }
    }
}

class AntColony {
    constructor(startPoint, endPoint, graph, numberOfAnts = 10) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.graph = graph;
        this.numberOfAnts = numberOfAnts;
        this.ants = [];
        this.bestPath = null;
        this.bestPathLength = Infinity;
    }

    // Function to initialize ants in the colony
    initializeAnts() {
        this.ants = [];
        for (let i = 0; i < this.numberOfAnts; i++) {
            this.ants.push(new Ant(this.startPoint, this.graph));
        }
    }

    // Function to start the optimization process
    optimizeRoute() {
        this.initializeAnts();
        for (let iteration = 0; iteration < 100; iteration++) {
            this.ants.forEach(ant => {
                while (ant.currentLocation !== this.endPoint && ant.path.length < Object.keys(this.graph).length) {
                    ant.move();
                }
                if (ant.totalDistance < this.bestPathLength) {
                    this.bestPath = ant.path;
                    this.bestPathLength = ant.totalDistance;
                }
                ant.layPheromones();
            });
            this.evaporatePheromones();
        }
    }

    // Function to evaporate pheromones
    evaporatePheromones() {
        for (let pathKey in pheromoneLevels) {
            pheromoneLevels[pathKey] *= (1 - evaporationRate);
        }
    }
}

function optimizeRoutesForLorries() {
    const numLorries = parseInt(document.getElementById('numLorries').value);
    for (let i = 1; i <= numLorries; i++) {
      const startPoint = document.getElementById('startPoint' + i).value;
      const endPoint = document.getElementById('endPoint' + i).value;
      const colony = new AntColony(startPoint, endPoint, graph);
      colony.optimizeRoute();
      displayOptimizedRoute(colony, i);
    }
  }

// Function to display the optimized route on the web page
function displayOptimizedRoute(colony, lorryNumber) {
    const routeStepsElement = document.getElementById('route-steps' + lorryNumber);
    routeStepsElement.innerHTML = `Lorry ${lorryNumber} Optimized Path: ${colony.bestPath.join(' -> ')}<br>Total Distance: ${colony.bestPathLength}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('numLorries').addEventListener('change', function() {
      const numLorries = parseInt(this.value);
      for (let i = 1; i <= 3; i++) {
        const lorryInput = document.getElementById('lorry' + i + 'Inputs');
        lorryInput.style.display = i <= numLorries ? 'block' : 'none';
      }
    });
  });