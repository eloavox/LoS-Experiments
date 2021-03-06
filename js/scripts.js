// mapArray holds the actual map data. visibleArray is a smaller, dynamic array that only holds the data for the visible area

var mapArray = [];
var visibleArray = [];
var perimeterArray = [];

// Player tracking coordinates, set to their starting value.
var playerY = 10;
var playerX = 10;

// Length and height of the level.

var xAxis = 50;
var yAxis = 50;

// sightLength is how far away the player can see when sight is unobstructed. Does NOT count the player space. sightBound helps define the constant size of visibleArray in order to keep viewsize consistent and avoid offset problems.

var sightLength = 10;
var sightBound = 2 * sightLength + 1;

// Controls density of pillars. Higher numbers will make fewer pillars

var openness = 30;

// Builds a basic map and rings it with bedrock ('B', i.e. a terminal object). Random sight-blocking pillars ('#') are populated according to openness. No sanity check in place.

function initializeMap() {
  for(y = 0; y <= yAxis; ++y){
    mapArray[y] = [];
    for(x = 0; x <= xAxis; ++x){
      if((Math.floor(Math.random() * (openness - 1)) + 1) <= 3){
        mapArray[y][x] = "#";
      }else{
        mapArray[y][x] = ".";
      }
      if(x === 0 || x === xAxis || y === 0 || y === yAxis){
        mapArray[y][x] = "B";
      }
    }
  }
  mapArray[playerX][playerY] = "@"
}

// Draws only the visible area of the map

function drawMap() {
  $("#main_con").text("");

  // Loops through the visible map area

  for(var y = 0; y <= sightBound; ++y){
    for(var x = 0; x <= sightBound; ++x){

      //Draws visibleArray with appropriate color markups.

      if(visibleArray[y][x] === "@"){
          $("#main_con").append("<span id='player'>@<span>");
      }else if(visibleArray[y][x] === "#"){
        $("#main_con").append("<span class='block'>#<span>");
      }else{
        $("#main_con").append("<span class='visible'>" + visibleArray[y][x] + "</span>");
      }
    }
  $("#main_con").append("<br>");
  }

}

// Determines the coordinates for drawing a line from x0, y0 to x1,y1. Terminates if plot() returns a false.

var drawline = function(x0,y0,x1,y1){
	var tmp;
	var steep = Math.abs(y1-y0) > Math.abs(x1-x0);
  if(steep){
  	//swap x0,y0
  	tmp=x0; x0=y0; y0=tmp;
    //swap x1,y1
    tmp=x1; x1=y1; y1=tmp;
  }

  var sign = 1;
	if(x0>x1){
    sign = -1;
    x0 *= -1;
    x1 *= -1;
  }
  var dx = x1-x0;
  var dy = Math.abs(y1-y0);
  var err = ((dx/2));
  var ystep = y0 < y1 ? 1:-1;
  var y = y0;

  // Goes down the line's coordinates, starting from the origin. If plot returns a false, drawline() terminates

  for(var x=x0;x<=x1;x++){
  	if(!(steep ? plot(y,sign*x) : plot(sign*x,y))) return;
    err = (err - dy);
    if(err < 0){
    	y+=ystep;
      err+=dx;
    }

  }
}

//Used by drawline to plot the current coordinates. Checks to see if current coordinates are a wall, and if so, sends back a false and terminates drawline(). Automatically populates visibleArray with the matching data in mapArray for the current coordinates regardless of outcome.

var plot = function(x,y){

  // sightLength is used as the visibleArray reference in order to keep the visible area centered on the player. mapArray also centers on the player when gathering reference data, but uses their actual position to do so.

  visibleArray[sightLength+y][sightLength+x] = mapArray[playerY+y][playerX+x];
  if(mapArray[playerY+y][playerX+x] !== "#"){
    return true;
  }
  else{
    return false;
  }
}

// Checks all sight vectors and populates visibleArray. The line of sight model used is square, and is dependant upon the level boundaries also being square (but not the traversible area of the level.)

function checkSight() {

  //These variables are what will prevent plot() from checking undefined array locations.

  var boundNorth;
  var boundSouth;
  var boundEast;
  var boundWest;

// The following for loops are checking for terminal objects (i.e. level boundaries) in each of the cardinal directions and, upon finding them, setting the boundVar to their relative distance from the player. Otherwise, the boundVar will equal the sightLength

  for(var i = 0; i >= sightLength * -1; --i){
    boundNorth = i;
    if(mapArray[playerY + i][playerX].match(/B/) !== null){
      break;
    }
  }

  for(var i = 0; i <= sightLength; ++i){
    boundSouth = i;
    if(mapArray[playerY + i][playerX].match(/B/) !== null){
      break;
    }
  }

  for(var i = 0; i <= sightLength; ++i){
    boundEast = i;
    if(mapArray[playerY][playerX + i].match(/B/) !== null){
      break;
    }
  }

  for(var i = 0; i >= sightLength * -1; --i){
    boundWest = i;
    if(mapArray[playerY][playerX + i].match(/B/) !== null){
      break;
    }
  }

// The following for loops build an array of perimeter coordinates using the boundaries established by the boundVars. This ensures that plot() will never attempt to look outside of mapArray's defined data.  Each loop handles 2 of the 8 octants.

  //    Octants:
  //     \1|2/
  //     8\|/3
  //     --+--
  //     7/|\4
  //     /8|5\

  perimeterArray = [];

  // Builds octant 1 and 6 perimeter values
  for(var i = 0; i >= boundWest; --i){
    perimeterArray.push([boundNorth,i]);
    perimeterArray.push([boundSouth,i]);
  }

  // Builds octant 8 and 3 perimter values
  for(var i = 0; i >= boundNorth; --i){
    perimeterArray.push([i,boundWest]);
    perimeterArray.push([i,boundEast]);
  }

  // Builds octant 2 and 5 perimter values
  for(var i = 0; i <= boundEast; ++i){
    perimeterArray.push([boundNorth, i]);
    perimeterArray.push([boundSouth, i]);
  }

  // Builds octant 4 and 7 perimter values
  for(var i = 0; i <= boundSouth; ++i){
    perimeterArray.push([i, boundWest]);
    perimeterArray.push([i, boundEast]);
  }

  // Resets and builds visibleArray at a constant size, and populates it with blank (i.e. invisible) spaces

  visibleArray = [];

  for(var i = 0; i <= sightBound; ++i) {
    visibleArray[i] = [];
    for(var j = 0; j <= sightBound; ++j){
      visibleArray[i][j] = "&nbsp;";
    }
  }

  // Checks visible area within allowed boundaries.

  for(var i = 0; i < perimeterArray.length ; ++i){
    var toY = perimeterArray[i][0];
    var toX = perimeterArray[i][1];

    // (origin y, origin x, draw to y, draw to x) ??
    drawline(0,0,toX,toY);
  }

}

// Always active keyboard input
window.addEventListener("keypress", doKeyDown, false);

// Links keyboard input with actions: currently just movement
function doKeyDown(event){
  if (event.keyCode === 119){
    playerMovement(-1, 0);
  } else if (event.keyCode === 97){
    playerMovement(0, -1);
  } else if (event.keyCode === 100){
    playerMovement(0, 1);
  } else if (event.keyCode === 115){
    playerMovement(1, 0);
  }else if (event.keyCode === 113){
    playerMovement(-1, -1);
  }else if (event.keyCode === 101){
    playerMovement(-1, 1);
  }else if (event.keyCode === 122){
    playerMovement(1, -1);
  }else if (event.keyCode === 99){
    playerMovement(1, 1);
  }
};

// Called upon particular keypress: takes in input, checks for viable movement, and redraws map if viable

function playerMovement(checkY, checkX){
  if(mapArray[playerY + checkY][playerX + checkX].match(/\./) !== null){
    mapArray[playerY][playerX] = '.';
    playerY += checkY;
    playerX += checkX;
    mapArray[playerY][playerX] = "@";
    checkSight();
    drawMap();
  }
};

$(document).ready(function() {
  initializeMap();
  checkSight();
  drawMap();
})
