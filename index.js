var game = {
  board: [],
  height: 8,
  width: 8,
  mines: 10,
  flags: 0,
  timeStarted: 0,
  timerInterval: undefined,
  showCheats: false,
  initialize: function() {
    //clear board
    this.board = [];
    this.flags = 0;
    $('.board').empty();
    
    //reset timer
    this.resetTimer();
    
    //set width
    $('.board-container').css('width', 24 * this.width);
    
    //set lables
    $('.board-height').text(this.height);
    $('.board-width').text(this.width);
    $('.board-mines').text(this.mines);
    
    //reset game over notices
    $('.game-over-won').hide();
    $('.game-over-fail').hide();
    
    //generate random mines
    var randomMines = [];
    while (randomMines.length < this.mines) {
      var randomResult = parseInt(Math.random() * ((this.height * this.width) - 1) + 1);
      if ($.inArray(randomResult, randomMines) == -1) {
        randomMines.push(randomResult);
      }
    }
    
    //build board
    var currentTile = 1;
    for (var y = 0 ; y < this.height ; y++) {
      this.board[y] = [];
      
      for (var x = 0 ; x < this.width ; x++) {
        this.board[y][x] = {
          mine: $.inArray(currentTile, randomMines) != -1,
          flag: false,
          question: false,
          open: false,
          hint: 0
        };
        
        $('.board').append('<div class="cell" data-y="'+ y +'" data-x="'+ x +'" '+ (this.board[y][x].mine ? 'rel="tooltip" data-animation="false" data-placement="right" title="burn"' : '') +'></div>');
        
        currentTile++;
      }
    }
    
    //generate hints
    for (var y = 0 ; y < this.height ; y++) {
      for (var x = 0 ; x < this.width ; x++) {
        this.board[y][x].hint = this.deadlyNeighbors(y, x);
        if (!this.board[y][x].mine && this.board[y][x].hint > 0) {
          $('[data-y="'+ y +'"][data-x="'+ x +'"]').text(this.deadlyNeighbors(y, x));
        }
      }
    }
    
    //should we show cheats?
    if (this.showCheats) {
      $('[rel="tooltip"]').tooltip('destroy');
      $('[rel="tooltip"]').tooltip();
    }
    
    //setup contextmenu events
    $('[data-x]').contextmenu(function(event) {
      game.startTimer();
      
      if (game.board[$(this).data('y')][$(this).data('x')].open) {
        return false;
      }
      
      if (game.board[$(this).data('y')][$(this).data('x')].flag) {
        game.board[$(this).data('y')][$(this).data('x')].flag = false;
        
        if (game.board[$(this).data('y')][$(this).data('x')].hint != 0) {
          $(this).html(game.board[$(this).data('y')][$(this).data('x')].hint);
        }
        else {
          $(this).html('');
        }
        
        //mine label
        game.flags--;
        $('.board-mines').text(game.mines - game.flags);
      }
      else {
        //flag this tile
        game.board[$(this).data('y')][$(this).data('x')].flag = true;
        $(this).html('<i class="icon-flag"></i>');
        
        //mine label
        game.flags++;
        $('.board-mines').text(game.mines - game.flags);
      }
      return false;
    });
    
    //setup click events
    $('[data-x]').mousedown(function(event) {
      game.startTimer();
      
      //did we right click?
      if (event.which == 3) {
        return false;
      }
      
      //is this flagged?
      if (game.board[$(this).data('y')][$(this).data('x')].flag) {
        return false;
      }
      
      //open the cell
      game.board[$(this).data('y')][$(this).data('x')].open = true;
      $(this).addClass('cell-open');
      
      //did we click on a super-safe tile?
      if (game.board[$(this).data('y')][$(this).data('x')].hint == 0 && !game.board[$(this).data('y')][$(this).data('x')].mine) {
        game.openNeighbors($(this).data('y'), $(this).data('x'));
        game.updateBoard();
      }
      
      //did we click on a mine?
      if (game.board[$(this).data('y')][$(this).data('x')].mine) {
        //mark failure
        $(this).addClass('cell-fail');
        
        //game over (fail)
        game.gameOver(false);
      }
    });
  },
  startTimer: function() {
    if (game.timeStarted == 0) {
      game.timeStarted = new Date();
      game.timerInterval = setInterval(game.updateTimer, 10);
    }
  },
  resetTimer: function() {
    game.stopTimer();
    game.timeStarted = 0;
    game.updateTimer();
  },
  updateTimer: function() {
    if (game.timeStarted == 0) {
      $('.board-time').text('0.00');
      return;
    }
    
    var timeSpent = ((new Date()) - game.timeStarted) / 1000;
    $('.board-time').text(((timeSpent * 100) / 100).toFixed(2));
  },
  stopTimer: function() {
    clearInterval(game.timerInterval);
    game.timerInterval = undefined;
  },
  gameOver: function(success) {
    game.stopTimer();
    
    if (success) {
      $('.game-over-won').show();
    }
    else {
      $('.game-over-fail').show();
      
      //show other mines
      game.showMines();
    }
    
    //unbind board events
    $('[data-x]').unbind('mousedown');
    $('[data-x]').unbind('contextmenu');
  },
  showMines: function() {
    for (var y = 0 ; y < this.height ; y++) {
      for (var x = 0 ; x < this.width ; x++) {
        if (this.board[y][x].mine) {
          $('[data-y="'+ y +'"][data-x="'+ x +'"]').addClass('cell-open');
          $('[data-y="'+ y +'"][data-x="'+ x +'"]').html('<i class="icon-fire"></i>')
        }
      }
    }
  },
  setSize: function(height, width, mines) {
    this.height = height;
    this.width = width;
    this.mines = mines;
    this.initialize();
  },
  get: function(y, x) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    
    return this.board[y][x];
  },
  deadlyNeighbors: function(y, x) {
    var count = 0;
    if (this.get(y + 1, x + 1) && this.get(y + 1, x + 1).mine) { count++; }
    if (this.get(y + 1, x)     && this.get(y + 1, x).mine)     { count++; }
    if (this.get(y + 1, x - 1) && this.get(y + 1, x - 1).mine) { count++; }
    if (this.get(y, x - 1)     && this.get(y, x - 1).mine)     { count++; }
    
    if (this.get(y - 1, x - 1) && this.get(y - 1, x - 1).mine) { count++; }
    if (this.get(y - 1, x)     && this.get(y - 1, x).mine)     { count++; }
    if (this.get(y - 1, x + 1) && this.get(y - 1, x + 1).mine) { count++; }
    if (this.get(y, x + 1)     && this.get(y, x + 1).mine)     { count++; }
    return count;
  },
  openNeighbors: function(y, x) {
    var y2, x2;
    
    y2 = y + 1; x2 = x + 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y + 1; x2 = x;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y + 1; x2 = x - 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y; x2 = x - 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y - 1; x2 = x - 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y - 1; x2 = x;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y - 1; x2 = x + 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
    
    y2 = y; x2 = x + 1;
    if (this.get(y2, x2) && !game.board[y2][x2].open) { game.board[y2][x2].open = true; if (game.board[y2][x2].hint == 0) game.openNeighbors(y2, x2); }
  },
  updateBoard: function() {
    for (var y = 0 ; y < this.height ; y++) {
      for (var x = 0 ; x < this.width ; x++) {
        if (this.board[y][x].open) {
          $('[data-y="'+ y +'"][data-x="'+ x +'"]').addClass('cell-open');
        }
      }
    }
  },
  controls: {
    restart: function(e) {
      game.initialize();
    },
    validate: function(e) {
      var flagCount = 0;
      
      for (var y = 0 ; y < game.height ; y++) {
        for (var x = 0 ; x < game.width ; x++) {
          if (game.board[y][x].mine) {
            if (!game.board[y][x].flag) {
              return game.gameOver(false);
            }
          }
          
          if (game.board[y][x].flag) flagCount++;
        }
      }
      
      //wrong flag count?
      if (flagCount != game.mines) {
        return game.gameOver(false);
      }
      
      //looks good game over (win)
      return game.gameOver(true);
    },
    cheat: function(e) {
      if (!game.showCheats && confirm('You really want to cheat?')) {
        game.showCheats = true;
        $('.cheats-label').text('Cheats On');
        $('[rel="tooltip"]').tooltip();
      }
      else {
        game.showCheats = false;
        $('.cheats-label').text('Cheats Off');
        $('[rel="tooltip"]').tooltip('destroy');
      }
    }
  }
};

//controls
$('.btn-restart').click(game.controls.restart);
$('.btn-validate').click(game.controls.validate);
$('.btn-cheat').click(game.controls.cheat);

//presets
$('.preset-beginner').click(function() {
  game.setSize(8, 8, 10);
});
$('.preset-intermediate').click(function() {
  game.setSize(16, 16, 40);
});
$('.preset-expert').click(function() {
  game.setSize(24, 32, 99);
});
$('.preset-custom').click(function() {
  var height = $('.form-custom [name="height"]').val();
  var width = $('.form-custom [name="width"]').val();
  var mines = $('.form-custom [name="mines"]').val();
  
  //validate
  var intCheck = /^\d+$/;
  if (!intCheck.test(mines)) {
    alert('Mine count should be a non-negative number silly pants.');
    return false;
  }
  else if (mines == 0 || mines == '0') {
    alert('Only posers would choose zero mines.');
    return false;
  }
  else if (mines > ((height * width) / 3)) {
    alert('You can\'t have more mines than 1/3 of the total tiles. In your case: '+ ((height * width) / 3).toFixed(0) +' mines maximum.');
    return false;
  }
  
  //hide the modal
  $('#myModal').modal('hide');
  
  //start a custom sized game
  game.setSize(height, width, mines);
});

//start sweep or die
game.initialize();

