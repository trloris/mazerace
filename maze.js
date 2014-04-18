var Cell = function(x, y) {
    this.HasTopWall = true;
    this.HasBottomWall = true;
    this.HasLeftWall = true;
    this.HasRightWall = true;
    this.visited = false;
    this.x = x;
    this.y = y;

    var allWallsIntact = function() {
        return this.HasTopWall && this.HasBottomWall && this.HasLeftWall && this.HasRightWall;
    }

    this.validCell = function() {
        return allWallsIntact.call(this) && !this.visited;
    }

    this.knockDownWallBetween = function(cell) {
        if (cell.x === this.x - 1) {
            this.HasLeftWall = false;
            cell.HasRightWall = false;
        } else if (cell.x === this.x + 1) {
            this.HasRightWall = false;
            cell.HasLeftWall = false;
        } else if (cell.y === this.y -1) {
            this.HasTopWall = false;
            cell.HasBottomWall = false;
        } else {
            this.HasBottomWall = false;
            cell.HasTopWall = false;
        }
    }

    this.pretty = function(cell) {
        return {top: this.HasTopWall, bottom: this.HasBottomWall, left: this.HasLeftWall, right: this.HasRightWall};
    }
}

var Maze = function(width, height) {
    var findCellNeighborsWithWalls = function(cell) {
        var neighbors = [];
        var x = cell.x;
        var y = cell.y;
        if (x !== 0) {
            if (maze[x - 1][y].validCell()) {
                neighbors.push(maze[x - 1][y]);
            }
        }
        if (x !== width - 1) {
            if (maze[x + 1][y].validCell()) {
                neighbors.push(maze[x + 1][y]);
            }
        }
        if (y !== 0) {
            if (maze[x][y - 1].validCell()) {
                neighbors.push(maze[x][y - 1]);
            }
        }
        if (y !== height - 1) {
            if (maze[x][y + 1].validCell()) {
                neighbors.push(maze[x][y + 1]);
            }
        }

        return neighbors;
    }

    var totalCells = width * height;

    var maze = new Array(width || 10);
    for (i = 0; i < width; i++) {
        maze[i] = new Array(height || 10);
        for (j = 0; j < height; j++) {
            maze[i][j] = new Cell(i, j);
        }
    }

    var randomX = Math.floor((Math.random() * width));
    var randomY = Math.floor((Math.random() * height));

    var currentCell = maze[randomX][randomY];
    currentCell.visited = true;
    var visitedCells = 1;
    var cellStack = [];
    console.log(currentCell.validCell());
    while (visitedCells < totalCells) {
        var neighbors = findCellNeighborsWithWalls(currentCell);
        if (neighbors.length > 0) {
            var randomCellIndex = Math.floor((Math.random() * neighbors.length));
            var randomCell = neighbors[randomCellIndex];
            randomCell.knockDownWallBetween(currentCell);
            cellStack.push(currentCell);
            currentCell = randomCell;
            currentCell.visited = true;
            visitedCells++;
        } else {
            currentCell = cellStack.pop();
        }
    }

    this.maze = maze;

    this.pretty = function() {
        var prettyContents = new Array(width);
        for (var i = 0; i < width; i++) {
            prettyContents[i] = new Array(height);
            for (var j = 0; j < height; j++) {
                prettyContents[i][j] = maze[i][j].pretty();
            }
        }

        return prettyContents;
    }
}