const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

document.body.style.width = `${window.innerWidth}px`;
document.body.style.height = `${window.innerHeight}px`;

const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;
const borderSize = 2;
const wallSize = 3;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width,
    height,
    wireframes: false,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, borderSize, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, borderSize, { isStatic: true }),
  Bodies.rectangle(0, height / 2, borderSize, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, borderSize, height, { isStatic: true }),
];
World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  // If I have visited the cell at [row, column], then return.
  if (grid[row][column]) {
    return;
  }

  // Mark this cell as being visited.
  grid[row][column] = true;

  // Assemble randomly-ordered list of neighbors.
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left'],
  ]);

  // For each neighbor...
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // See if that neighbor is out of bounds.
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }

    // If we have visited that neighbor, continue to next neighbor.
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // Remove a wall from either horizontals or verticals array.
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    // Visit next cell.
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

// Show walls on screen.
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      wallSize,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#4B4673',
        },
      }
    );

    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      wallSize,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#4B4673',
        },
      }
    );

    World.add(world, wall);
  });
});

// Goal.
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: '#80DF86',
    },
  }
);

World.add(world, goal);

// Play ball.
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: 'ball',
});

World.add(world, ball);

// Handling keyboard events to move the ball.
document.addEventListener('keydown', (evt) => {
  const { x, y } = ball.velocity;
  const speedLimit = 5;

  if (evt.code === 'KeyW' && y > -speedLimit) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  if (evt.code === 'KeyA' && x > -speedLimit) {
    Body.setVelocity(ball, { x: x - 5, y });
  }

  if (evt.code === 'KeyS' && y < speedLimit) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  if (evt.code === 'KeyD' && x < speedLimit) {
    Body.setVelocity(ball, { x: x + 5, y });
  }
});

// Win condition.
Events.on(engine, 'collisionStart', (evt) => {
  evt.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
