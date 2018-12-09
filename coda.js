/**
 * @fileOverview Javascript file for coda interview
 * The following program retrieves and solves one maze
 * @author Hozaifa Abdalla
 * @version 1.0.0
 * @module coda js
 */

 const axios = require('axios');
 const retry = require('async-retry');

 // global components
 const Maze = {
     WIDTH: 0,
     HEIGHT: 0,
     ID: '',
     data: [],
     sol: [],
     memo: [],
     stack: []
 };

 /**
  * asynchronous method that obtains the maze from coda's server
  * @function
  * @return {object} - ok(true or false), data if any, error if any
  */

 var getMaze = async () => {
  try{
     const data = await retry(async bail => {
       // if anything throws, we retry
       console.log("Sending request to coda!");
       const res = await axios.post('https://maze.coda.io/maze');
       console.log(res);
       if (403 === res.status) {
         // don't retry upon 403
         bail(new Error('Unauthorized'));
         return;
       }
       return res.data;
     }, {
       retries: 5
     });

     return {
       ok: true,
       data: data
     }
   }catch(err){
     //console.log(err);
     console.log("Server didn't respond!");
     return {
       ok: false,
       err
     }
   }
};


 /**
  * initializes the mazes 2d array with 0's(invalid moves)
  * @function
  * @param {array} - array to initialize
  * @param {integer} - width
  * @param {integer} - height
  */

 var initArray = (arr1, arr2, width, height) => {
     // constructing empty 2d array
     for (var i = 0; i < height; i++) {
         arr1[i] = new Array();
         arr2[i] = new Array();
         for (var j = 0; j < width; j++) {
             arr1[i][j] = 0;
             arr2[i][j] = false;
         }
     }
 };

 /**
  * initializes the mazes properties and 2d array
  * @function
  * @param {object} - width, height, and id
  * @module coda js
  */

 var initMazeProps = (data) => {
   Maze.WIDTH = data.width;
   Maze.HEIGHT = data.height;
   Maze.ID = data.id;

   // initializing 2d array for maze with the starting point and ending point
   initArray(Maze.data, Maze.memo, Maze.WIDTH , Maze.HEIGHT);
 };

 /**
  * initializes the Maze and obtains all the valid moves from the server
  * @function
  */

 var initMaze = async () => {
    const {ok, err, data} = await getMaze();
    if(ok){
      // initializing maze properties
      initMazeProps(data);

      console.log("Successfully initialized Maze!");
      console.log(Maze);

      const ok = await getValidBoardMoves();
      if(ok){
        console.log("Successfully initialized Board with valid moves ...");
        console.log(Maze.data);
      }else{
        console.log("Failed to initialize Board with valid moves ...");
      }
      return {
        ok: true
      }
    }else{
      return {
        ok: false,
        err
      }
    }
 };

 /**
  * checks if the passed in coordinates are valid from the server
  * @function
  * @param {x} - x coordinate
  * @param {y} - y coordinate
  * @return {boolean} - weather a move is valid or not
  */

 var isValid = async (x, y) => {
   try{
     const data = await retry(async bail => {
       // if anything throws, we retry
       console.log(`Asking Coda if {x:${x} y:${y}}`);
       const res = await axios.get('https://maze.coda.io/maze/' + Maze.ID + '/check?x=' + x + '&y=' + y);
     }, {
       retries: 0
     });
     return {
       ok: true
     }
   }catch(err){
     console.log("Error from coda validating coordinates ...");
     if(err == undefined || err.response.status === 503){
       console.log(`Resending Coda {x:${x} y:${y}} ...`);
       return await isValid(x, y);
     }

     // console.log(err);
     if (403 === err.response.status) {
       // don't retry upon 403
       return {
         ok: false
       }
     }

   }
 };

 /**
  * checks if the passed in coordinates are within boundaries or not
  * @function
  * @param {x} - x coordinate
  * @param {y} - y coordinate
  * @return {boolean} - weather a move is valid or not
  */

var isSafe = (x, y) => {
  // check if x and y are within bounds of matrix
  const xValid = x >= 0 && x < Maze.HEIGHT;
  const yValid = y >= 0 && y < Maze.WIDTH;
  const withinBounds = xValid && yValid;

  if(!withinBounds)
    return false;

  return Maze.data[x][y] === 1; // if piece is valid
};

/**
 * prints the solution
 * @function
 */

var printSolution = () => {
  for (let i = 0; i < Maze.HEIGHT; i++){
      for (let j = 0; j < Maze.WIDTH; j++)
          System.out.print(" " + Maze.sol[i][j] + " ");
      System.out.println();
  }
}

/**
 * Obtains all the validity of all the board pieces from the server
 * @function
 */

var getValidBoardMoves = async () => {
  for(let x = 0; x < Maze.HEIGHT; x++){
    for(let y = 0; y < Maze.WIDTH; y++){
      const { ok } = await isValid(x, y);
      if(ok){
        console.log(`Move {x:${x} y:${y}} is valid!`);
        Maze.data[x][y] = 1;
      }else{
        console.log(`Move {x:${x} y:${y}} is invalid!`);
        Maze.data[x][y] = 0;
      }
    }
  }
  // console.log(Maze.data);
};

/**
 * adds the coordinate pair to the solution set
 * @function
 * @param {x} - x coordinate
 * @param {y} - y coordinate
 */

var addPosition = (x, y) => {
  Maze.sol.push({x, y});
  Maze.stack.push({x, y});
};

/**
 * removes the coordinate pair to the solution set
 * @function
 * @param {x} - x coordinate
 * @param {y} - y coordinate
 */

var removePosition = () => {
  //console.log(`Removing {x:${x} y:${y}} to solution ...`);
  Maze.sol.pop();
  Maze.stack.pop();
};

/**
 * solves the maze wrapper
 * @function
 */

var solveMaze = () => {
  var pathSoFar = {};
  var memo = {};
  solveMazeUtil(0,0, pathSoFar, memo);
};

/**
 * creates a point object
 * @function
 */

var Point = (x,y) => {
  return {
    x: x,
    y: y
  };
};

/**
 * hashes a point object
 * @function
 */
var hash = (point) => {
  return point.x.toString() + point.y.toString();
};

/**
 * removes a point from the passed in map
 * @function
 */
var removePoint = (map, point) => {
  var id = hash(point);
  delete map[id];
};

/**
 * adds a point to the map passed in
 * @function
 */
var addPoint = (map, point, value) => {
  var id = hash(point);
  map[id] = value;
};

/**
 * checks if a point exist in the map
 * @function
 */
var containsPoint = (map, point) => {
  var id = hash(point);
  return map.hasOwnProperty(id);
};

/**
 * obtains the desired point from the map
 * @function
 */
var getPoint = (map, point) => {
    var id = hash(point);
    return map[id];
};

/**
 * checks if coordinates are out of bounds
 * @function
 */
var outOfBounds = (x, y) => {
    if(x < 0 || x >= Maze.HEIGHT || y < 0 || y >= Maze.WIDTH)
      return true;

    return false
};

/**
 * recursive function that goes through the maze piece by piece with memoization and cycle detection
 * @function
 * @param {x} - x coordinate
 * @param {y} - y coordinate
 */

var solveMazeUtil = (x, y, pathSoFar, memo) => {
    var point = Point(x, y);

    // check if we are out of bounds or at an invalid move or running into the same pathSoFar
    if(outOfBounds(x,y) || !isSafe(x, y) || containsPoint(pathSoFar, point))
      return false;

    // check if we are at the destination
    if(x === Maze.HEIGHT - 1 && y === Maze.WIDTH - 1){
      addPosition(x, y);
      return true;
    }

    // add to path so pathSoFar
    addPoint(pathSoFar, point, point);
    addPosition(x, y);

    var points = [];
    points.push(Point(x+1, y)); // moving down
    points.push(Point(x, y+1)); // moving right
    points.push(Point(x-1, y)); // moving up
    points.push(Point(x, y-1)); // moving left

    // iterate through each point
    for(var i = 0; i < points.length; i++){
      var singlePoint = points[i];
      console.log("moving to ...." + JSON.stringify(singlePoint));

      // check if point is in memo
      if(containsPoint(memo, singlePoint)){
        console.log("returning memoized point at ..." + JSON.stringify(singlePoint));
        return getPoint(memo, singlePoint);
      }

      // traverse in a direction
      if(solveMazeUtil(singlePoint.x, singlePoint.y, pathSoFar, memo)){
        console.log("adding point to memoization as true ..." + JSON.stringify(singlePoint));
        addPoint(memo, singlePoint, true);
        return true;
      }
    }

    console.log("adding point to memoization as false ..." + JSON.stringify(singlePoint));

    // remove point from path so far and set false in memo
    addPoint(memo, point, false);
    removePoint(pathSoFar, point);
    removePosition();
    return false;
};

/**
 * submits the solution set to the server
 * @function
 */

var submitMaze = async () => {
  try{
    const data = await retry(async bail => {
      // if anything throws, we retry
      console.log("Submitting Solution to Coda ...");
      const res = await axios.post('https://maze.coda.io/maze/' + Maze.ID + '/solve', Maze.sol);
      console.log(`Coda responded: ${res.data}`);
      return res.data;
    }, {
      retries: 5
    });
    return {
      ok: true
    }
  }catch(err){
    console.log(err);
    if (403 === err.response.status) {
      // don't retry upon 403
      return {
        ok: false
      }
    }

    console.log(err.response.status);
    if(err.response.status === 503){
      console.log(`Resubmitting Solution to Coda ...`);
      return await submitMaze();
    }
  }
};

 /**
  * main method of entire program
  * @function
  * @module coda js
  */

 var main = async () => {
   const {ok, err} = await initMaze();
   if(ok){
     console.log("Maze is initialized with valid board moves!!");
     console.log(Maze.data);
     solveMaze();
     console.log("Maze is Successfully solved!");
     console.log(Maze.sol);
     await submitMaze();
   }else{
     console.error(`Failed to initialize Maze!`);
   }
 }

main();
