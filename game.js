var Game = function(gameDetails) {
    this.mazeContents = gameDetails.maze;
    this.start = gameDetails.start;
    this.end = gameDetails.end;
    this.players = gameDetails.players;
    this.ctx = document.getElementById('bg').getContext('2d');
}

Game.prototype.drawBG = function() {
    this.ctx.clearRect(0, 0, this.x * 10 + 1, this.y * 10 + 1);
    this.ctx.beginPath();
    for (var i = 0; i < this.x; i++) {

        for (var j = 0; j < this.y; j++) {
            this.ctx.beginPath();
            if(this.mazeContents[i][j].top) {
                this.ctx.moveTo(i * 10, j * 10);
                this.ctx.lineTo(i * 10 + 10, j * 10);
            }
            if(this.mazeContents[i][j].bottom) {
                this.ctx.moveTo(i * 10, j * 10 + 10);
                this.ctx.lineTo(i * 10 + 10, j * 10 + 10);
            }
            if(this.mazeContents[i][j].left) {
                this.ctx.moveTo(i * 10, j * 10);
                this.ctx.lineTo(i * 10, j * 10 + 10);
            }
            if(this.mazeContents[i][j].right) {
                this.ctx.moveTo(i * 10 + 10, j * 10);
                this.ctx.lineTo(i * 10 + 10, j * 10 + 10);
            }
            this.ctx.stroke();
        }
    }

    // Draw staring and ending locations
    this.ctx.fillStyle = "green";
    this.ctx.fillRect(this.startingLocation.x * 10 + 1, this.startingLocation.y * 10 + 1, 8, 8);
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(this.endingLocation.x * 10 + 1, this.endingLocation.y * 10 + 1, 8, 8);
}

Game.prototype.addPlayer = function(player) {
    this.players[player.id] = player;
}