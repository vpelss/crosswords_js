//bugs
//letter search fails on 7 x 7 with optimum but not with naive 6 x 6
//save to file and save cookies? will we need to revert html js to function without crossword.js?
//webworker for just recursive. feed words and puzzle , etc

//is promise async?

//"use strict";

var start_time;
var recursive_count = 0;

var pad_char = 'x';
var unoccupied = 'o';
var pads_either_side = 'padsEitherSide';

//puzzle will be accessed a lot if using letter searches! but js arrays and associative arrays are comparable ONLY if the key is a simple integer
//{} object will be easier to read in code puzzle[x][y] but is really hard to decipher when looking at the object itself
//[] arrays you will have to start with puzzle[y][x] or make code more complex (not by much) to create array first, OR convert puzzle[y][x] to puzzle[x][y]
//I think the ease of visualizing [] internally for troubleshooting is the better option.
var puzzle = []; // puzzle[y][x] = 'the_letter'
var puzzle_width;
var puzzle_height;
const dir_across = 0;
const dir_down = 1;
var word_lengths = {}; //wordLengths[wordLength] = 1 ; so we have a list of word sizes = object.keys(wordLengths);
var words_of_length = {}; //a count of the number of words of length x : words_of_length[x]
var words_of_length_string = {}; // ,word1,word2, etc
var linear_word_search = {}; // linear_word_search[WORo] = next letter : next_letters = Object.keys(linear_word_search[ mask ]);

//key orders should be [dir][yy][xx] for less typeof calls and for readability when troubleshooting !!!
var letter_positions_of_word = []; //letter_positions_of_word[dir][word_number] returns [ ofLetterPositions ];
var position_in_word = []; //position_in_word[dir][yy][xx] = position_count

var this_square_belongs_to_word_number = []; //this_square_belongs_to_word_number[dir][yy][xx]

var all_masks_on_board = []; //all_masks_on_board[dir][word_number] returns the letters that have been laid down including unoccupied. eg: XoLoooo

//var walkpath = '';
var mode = ''; //letter or word

var next_letter_position_on_board = [];
// all letter position on board used for cycling through letter placements, etc
// [{x => $x, y => $y} , , ]
// next_letter_position_on_board[]{x} NextWordPositionsOnBoard[]{y}

var next_word_on_board = []; //next_word_on_board = [ [word_number , dir] , [] , ... ]
//all words position on board used for cycling through word placements, etc
// [{wordNumber => word_number, dir => dir},{},{}...]
//$nextWordOnBoard[]{wordNumber} $nextWordOnBoard[]{dir}

//optimal search variables
//var word_number_dir_used; //word_number_dir_used{word_number}{dir} so we only backtrack or note words that have been filled
var naive_backtrack = 0; //a counter
var optimal_backtrack = 0; //a counter
//var touchingWordsForBackTrack; //global as we need to backtrack to the first  member of it we encounter. if not == () we are in a backtrack state!
var target_cells_for_letter_backtrack = {}; //global as we need to backtrack to the first  member of it we encounter. if $targetLettersForBackTrack{x failed letter}{y failed letter} == undef there are NO targets!
//target_cells_for_letter_backtrack[x_y][xx_yy] = 1; //x_y is this cell and target _cells are stored in keys xx_yy!
var target_words_for_word_backtrack = {}; //global as we need to backtrack to the first  member of it we encounter. if $target_words_for_word_backtrack{# source}{dir source} == undef there are NO targets!
//eg $target_words_for_word_backtrack{word_numberSource}{dirSource}{$crossingWordNumber}{$crossingWordDir}
var words_that_are_inserted = {};

var forward_count = 0;
//var naive_count = 0;

var number_of_HV_words = []; //used in to test completion of recursiveWords()
number_of_HV_words[0] = 0;
number_of_HV_words[1] = 0;
//var clues = {};

//nav vars
var startx ; //based on word #1 across or down
var starty ;
var LetterPosArray;
var OldLetterPosArray;
var horizvert = 0;
var OldClue = [1,1,'cell'];
var CurrentFocus;
var CurrentClass;
var NthPosition;
var CurrentPos;

//main();
var arg_shuffle;
var arg_optimalbacktrack;
var arg_wordfile;
var arg_simplewordmasksearch;
function main() {
	start_time = Date.now();

	hide2('Answers');

	//url arg processing
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	arg_shuffle = urlParams.get('shuffle');

	if (!urlParams.has('wordfile')) {
		setCellsFromCookies();
		return;
	}

	var arg_grid = urlParams.get('grid');
	grid_change(arg_grid);

	numberBlankSquares();

	arg_wordfile = urlParams.get('wordfile');
	var arg_walkpath = urlParams.get('walkpath');
	if (arg_walkpath.includes('Letter')) {
		mode = 'letter';
	} else {
		mode = 'word';
	}
	loadWordList(arg_wordfile);

	//word walks
	if (arg_walkpath == 'crossingwords') {
		generateNextWordPositionsOnBoardCrossing();
	}
	if (arg_walkpath == 'zigzag') {
		generateNextWordPositionsOnBoardZigZag();
	}
	if (arg_walkpath == 'diagonal') {
		generateNextWordPositionsOnBoardDiag();
	}
	if (arg_walkpath == 'numerical') {
		generateNextWordPositionsOnBoardNumerical();
	}
	if (arg_walkpath == 'acrossthendown') {
		generateNextWordPositionsOnBoardAcrossThenDown();
	}




	//letter walks
	if (arg_walkpath == 'GenerateNextLetterPositionsOnBoardFlat') {
		generateNextLetterPositionOnBoardFlat();
	}
	if (arg_walkpath == 'GenerateNextLetterPositionsOnBoardZigZag') {
		generateNextLetterPositionOnBoardZigzag();
	}
	if (arg_walkpath == 'GenerateNextLetterPositionsOnBoardDiag') {
		generateNextLetterPositionsOnBoardDiag();
	}



	// is simplewordmasksearch=on
	 arg_simplewordmasksearch = urlParams.get('simplewordmasksearch');

	arg_optimalbacktrack = urlParams.get('optimalbacktrack');
	if (arg_optimalbacktrack) {
		calculateOptimalBacktracks();
	}

	printProcessing();

	if (mode == 'word') {
		recursiveWords2();
	} else {
		recursiveLetters();
	}

	numberClueList();

	printProcessing();

	document.getElementById('puzzle_place').innerHTML = printPuzzle();
	document.getElementById('Answers').innerHTML = printSolvedPuzzle();

//prep nav
if(typeof letter_positions_of_word[dir_across][1]){
	starty = letter_positions_of_word[dir_across][1][0][0];
	startx = letter_positions_of_word[dir_across][1][0][1];
}
else{
	starty = letter_positions_of_word[dir_down][1][0][0];
	startx = letter_positions_of_word[dir_down][1][0][1];
}

LetterPosArray = [[startx,starty]];
OldLetterPosArray = [[startx,starty]];
horiz_vert = 0; //0 is  horiz 1 is vert
OldClue = '';
CurrentFocus = ''; //ID Name  where letters will be inserted
CurrentClass = 'tdwhiteclass'; //for remembering the class to return the square too
NthPosition = 0; //so we can find the next square to type a letter into
CurrentPos = new Array(startx,starty); //CURRENTLY HIGLIGHTED BOX COORDINATES
}

function grid_change( file_name ){
  //forget previous setting
  puzzle = [];
  puzzle_width = 0;
  puzzle_height = 0;
  word_lengths = {};
  letter_positions_of_word = [];
  position_in_word = [];
  this_square_belongs_to_word_number = [];
  all_masks_on_board = [];

  var full_path_file = "./grids/" + file_name + ".txt";
  var grid_string = readStringFromFileAtPath ( full_path_file );
  var lines = grid_string.split(/\r?\n|\r|\n/g); //split on lines into array lines
  if( lines[lines.length-1].trim() == '' ){
   lines.pop();
  }//remove last line if empty

  puzzle_height = lines.length;
  lines.forEach( grid_getLetters ); //process lines array

  //make the grid a square filling with pad_char on the right
  puzzle.forEach( function(currentValue){
    var arr_length = currentValue.length;
    if(puzzle_width > arr_length) {
     currentValue.length = puzzle_width;
     currentValue.fill(pad_char , arr_length);
    }
  });

}

function readStringFromFileAtPath(pathOfFileToReadFrom){
	const request = new XMLHttpRequest();
	request.addEventListener("error", function(){return 0;});
	request.open("GET", pathOfFileToReadFrom, false);
	request.send(null);
	var status = request.status;
	if (status != 200 ) { return status; }
	var returnValue = request.responseText;
	return returnValue;
	}

function grid_getLetters(currentValue , y) {
	var line = currentValue.trim(); //remove whitespace
	if( line.length > puzzle_width ) {
	 puzzle_width = line.length;
	 }//keep seeing if we have a larger line width
	var letters = line.split(''); //split line into letters array
	for(var x = 0; x < line.length ; x++){
	   if (typeof puzzle[y] === 'undefined') { puzzle[y] = []; }//add second dimension
	   puzzle[y][x] = letters[x];
	}
 }

	function numberBlankSquares(){
 //gridToGlobalVars()
 //this does a lot of var setup
 //and also associate all squares with words and word # , get word lengths on grid ,
//thisSquareBelongsToWordNumber[$xx][$yy][dir]
//positionInWord[$xx][$yy][dir] = $PositionCount;
//letterPositionsOfWord[$numberCount][dir] = [TempLetterPositions];
//all_masks_on_board[$numberCount][dir] = $blankWord;
var x;
var y;
var word_length;
var word_number = 0;
var was_there_an_across_word = 0; //
var blank_word = '';
var dir;
var word_letter_positions_array = [];

//label all grid squares with data
  for (y = 0 ; y < puzzle_height ; y++) {
    for (x = 0 ; x < puzzle_width ; x++) {
      was_there_an_across_word = 0; //assume not
      for (dir = 0 ; dir < 2 ; dir++) { //#for both across 0 and down 1 words
        if(puzzle[y][x] == pad_char){continue;}
        word_letter_positions_array = getWordLetterPositions(x , y , dir);
        if(word_letter_positions_array){
          if( (word_letter_positions_array[0][0] == x) && (word_letter_positions_array[0][1] == y) ){//first letter in word?
             word_length = word_letter_positions_array.length;
             word_lengths[word_length] = 1; //mark globally that there is a word of this length
             if(! was_there_an_across_word ){//allows us to not increase count if across and down share first letter pos
				word_number++;
			 }
             was_there_an_across_word = 1;
			 number_of_HV_words[dir]++; //used in recursiveWords()
             //set letter_positions_of_word[$numberCount][dir] = [TempLetterPositions];
             if(typeof letter_positions_of_word[dir] === 'undefined' ){letter_positions_of_word[dir] = [];}
             letter_positions_of_word[dir][word_number] = JSON.parse(JSON.stringify(word_letter_positions_array)); //deep copy multi dim array
             //set all_masks_on_board[dir][word_number] = 'ooooooooo';
			 blank_word = ''; // must do to ensure we get the right word/mask length
             blank_word = blank_word.padEnd(word_length , unoccupied);
             if(typeof all_masks_on_board[dir] === 'undefined' ){all_masks_on_board[dir] = [];}
             all_masks_on_board[dir][word_number] = blank_word;
             //set position_in_word , this_square_belongs_to_word_number
             word_letter_positions_array.forEach(function(currentValue , index){
                   //set position_in_word for all word_letter_positions_array in this word
                   var xx = currentValue[0];
                   var yy = currentValue[1];
                   if(typeof position_in_word[dir] === 'undefined' ){position_in_word[dir] = [];}
                   if(typeof position_in_word[dir][yy] === 'undefined' ){position_in_word[dir][yy] = [];}
                   position_in_word[dir][yy][xx] = index;
                   //set this_square_belongs_to_word_number[dir][yy][xx] for all word_letter_positions_array in this word
                   if(typeof this_square_belongs_to_word_number[dir] === 'undefined' ){this_square_belongs_to_word_number[dir] = [];}
                   if(typeof this_square_belongs_to_word_number[dir][yy] === 'undefined' ){this_square_belongs_to_word_number[dir][yy] = [];}
                   this_square_belongs_to_word_number[dir][yy][xx] = word_number;
              });
          }
        }
      }
    }
  }

// biggest_word_number = word_number;
var crossing_cells = 0;
var total_cells = 0;
var white_cells = 0;
var pad_cells = 0;

//calculate interlock and density
  for(y = 0 ; y < puzzle_height ; y++){
    for(x = 0 ; x < puzzle_width ; x++){
       if(puzzle[y][x] == pad_char){pad_cells++;}
       if(puzzle[y][x] == unoccupied){white_cells++;}
      if( (typeof this_square_belongs_to_word_number[0][y][x] !== 'undefined') && (typeof this_square_belongs_to_word_number[1][y][x] !== 'undefined') ){
          crossing_cells++;
       }
    }
  }

  total_cells = puzzle_height * puzzle_width;
  var interlock = 100 * crossing_cells / total_cells;
  var density = 100 * white_cells / total_cells;

  console.log("Total Cells: " + total_cells);
  console.log("White Cells: " + white_cells);
  console.log("Pad Cells: " + pad_cells);
  console.log("Interlock: " + interlock);
  console.log("Density: " + density);
  console.log("Grid has words of lengths :");
  var wl = Object.keys(word_lengths);
  wl.forEach(function(currentValue){
    console.log(currentValue);
   });

}

function getWordLetterPositions(x,y,dir){
  var dx = 1 - dir;
		var dy = dir;
  var xx = x , yy = y;
  var letter_pos = [];
  //get to start of word
  while( (typeof puzzle[yy-dy] !== 'undefined') &&  (typeof puzzle[yy-dy][xx-dx] !== 'undefined') && (puzzle[yy-dy][xx-dx] != pad_char) ){
    xx=xx-dx;
    yy=yy-dy;
  }
  letter_pos.push([xx,yy]);
  //now look for all letters of word
  while( (typeof puzzle[yy+dy] !== 'undefined') && (typeof puzzle[yy+dy][xx+dx] !== 'undefined') && (puzzle[yy+dy][xx+dx] != pad_char) ){
    xx=xx+dx;
    yy=yy+dy;
    letter_pos.push([xx,yy]);
  }
  if(letter_pos.length == 1){
    return false;
  }//not a word
  return letter_pos;
}

function loadWordList(arg_wordfile) {
	//load word lists and set word and letter search variables
	var db = arg_wordfile;
	var wl = Object.keys(word_lengths);
	wl.forEach(function(word_length) {
		var file_and_path = './wordlists/' + db + '/words/' + word_length + '.txt';
		var word_list_text = readStringFromFileAtPath(file_and_path);
		//still need to process
		var word_list_array = word_list_text.split(/\r?\n|\r|\n/g); //split on lines into array
		if (word_list_array[word_list_array.length - 1].trim() == '') {
			word_list_array.pop();
		} //remove last line if empty

		words_of_length[word_length] = word_list_array.length;
		//process word_list_array
		words_of_length_string[word_length] = ''; //start blank
		word_list_array.forEach(function(word) {

			//if (mode == 'letter') { //letter walk
				var mask_pre = '';
				var mask = '';
				var letters_array = word.split('');
				letters_array.forEach(function( letter ) {
					mask = mask_pre.padEnd(word_length, unoccupied);
					if (typeof linear_word_search[mask] == 'undefined') {
						linear_word_search[mask] = {};
					} //create on first access
					linear_word_search[mask][letter] = 1; //letter list will be accessible by object.keys()
					mask_pre += letter;

				});
			//} else { //word walk
				words_of_length_string[word_length] = words_of_length_string[word_length] + ',' + word.toUpperCase();
			//}

		});
	});
	word_list_text = ''; //cleanup
}

function generateNextWordPositionsOnBoardCrossing(){
		//start with 1 horiz.
		//find all crossing words
		//find all their crossing words.
		//only add # and direction once!
		//FIFO

		//get my @WordLetterPositions = @{$letterPositionsOfWord[word_number][dir]}
		//used to find crossing words fast with @ThisSquareBelongsToWordNumber
		var already_in_list = {}; // already_in_list[number][direction] = 1 if already in list
		already_in_list[dir_across] = {};
		already_in_list[dir_down] = {};
		var word_number = 1;
		var dir = 0;

		if (typeof all_masks_on_board[dir][word_number] === 'undefined' ) {dir = dir_vert;}// no horizontal #1 word. go vertical
		var to_do_list = []; //list of words and directions to process. ((1,0) , (2,0) , .... ) shift off and push on so we do in an orderly fasion!
		to_do_list.push( [dir , word_number] );
		//if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
		already_in_list[dir][word_number] = 1;
		next_word_on_board.push( [dir, word_number] );
		while ( to_do_list.length > 0 ){
				[dir , word_number] = to_do_list.shift();
					var crossing_words = getCrossingWords(dir , word_number);
					while ( crossing_words.length > 0 ){
							[dir , word_number] = crossing_words.shift();
							//if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
							if (typeof already_in_list[dir][word_number] !== 'undefined'){
								continue;
							}//already added. skip
							to_do_list.push( [dir , word_number] );
							next_word_on_board.push( [dir , word_number] );
							if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
							already_in_list[dir][word_number] = 1;
					}
		}
}

function generateNextWordPositionsOnBoardZigZag() {
	//create a top right to bottom left list in which we will lay down words. FIFO
	//zigzag alternate top right to bottom left then botom left to top right
	var x = 0;
	var y = 0;
	var divX = -1;
	var divY = 1;

	do {
		//process cursor position
		var a = typeof puzzle[y];
		var b = typeof puzzle[y][x];

		if ((typeof puzzle[y] !== 'undefined') && (typeof puzzle[y][x] !== 'undefined')) {
			if (puzzle[y][x] != pad_char) {
				for (var dir = 0; dir < 2; dir++) { //see if we are at start of word. If so add to list
					var word_number = this_square_belongs_to_word_number[dir][y][x];
					if (position_in_word[dir][y][x] == 0) { //first letter in word!
						next_word_on_board.push([dir, word_number]);
					}
				}
			}
		}
		//next cell
		x = x + divX;
		y = y + divY;

		//test cursor position
		if ((x < 0) && (y > puzzle_height - 1)) { //bottom left corner
			divX = -divX;
			divY = -divY; //change directions
			x = 1;
			y = puzzle_height - 1;
			continue;
		}
		if ((x > puzzle_width - 1) && (y < 0)) { //top right corner
			divX = -divX;
			divY = -divY; //change directions
			x = puzzle_width - 1;
			y = 1;
			continue;
		}
		if (x < 0) { //off left
			divX = -divX;
			divY = -divY; //change directions
			x = 0;
			continue;
		}
		if (y < 0) { //off top
			divX = -divX;
			divY = -divY; //change directions
			y = 0;
			continue;
		}
		if (x > puzzle_width - 1) { //off right
			divX = -divX;
			divY = -divY; //change directions
			x = puzzle_width - 1;
			y = y + 2;
			continue;
		}
		if (y > puzzle_height - 1) { //off bottom
			divX = -divX;
			divY = -divY; //change directions
			x = x + 2;
			y = puzzle_height - 1;
			continue;
		}
	}
	while ((x != puzzle_width - 1) || (y != puzzle_height - 1));
	h=9;
}

function generateNextWordPositionsOnBoardDiag() {
	//create a top right to bottom left list in which we will lay down words. FIFO
	var x = 0;
	var y = 0;
	var divX = -1;
	var divY = 1;
	var diag_count = 0;

	do {
		//process cursor position
		if (puzzle[y][x] != pad_char) {
			//see if we are at start of word. If so add to list
			for (var dir = 0; dir < 2; dir++) {
				var word_number = this_square_belongs_to_word_number[dir][y][x];
				if (position_in_word[dir][y][x] == 0) { //first letter in word!
					next_word_on_board.push([dir, word_number]);
				}
			}
		}
		//next cell
		x = x + divX;
		y = y + divY;
		//are we outside puzzle? push us back in
		if ((x < 0) || (y > puzzle_height - 1)) {
			diag_count++;
			x = diag_count;
			if (x > puzzle_width - 1) {
				x = puzzle_width - 1;
				y = diag_count - x;
			} else {
				y = 0;
			}
			continue;
		}
	}
	while ((x != puzzle_width - 1) || (y != puzzle_height - 1));
}

function generateNextWordPositionsOnBoardNumerical() {
	//create a sequential list in which we will lay down words. FIFO
	//just go numerically 1 .. ??? alternating horiz / vert
	for (var word_number = 1; word_number < 300; word_number++) { //loop through all word numbers even if they don't exist
		for (var dir = 0; dir < 2; dir++) {
			var word = all_masks_on_board[dir][word_number]; // get WORD or MASK at this crossword position
			if (typeof word === 'undefined') {
				continue;
			}
			next_word_on_board.push([dir, word_number]);
		}
	}
}

function generateNextWordPositionsOnBoardAcrossThenDown() {
	//create a sequential list in which we will lay down words. FIFO
	//just go numerically 1 .. ??? alternating all horiz then all vert

	for (var dir = 0; dir < 2; dir++) {
		for (var word_number = 1; word_number < 300; word_number++) { //loop through all word numbers even if they don't exist
			var word = all_masks_on_board[dir][word_number]; // get WORD or MASK at this crossword position
			if (typeof word === 'undefined') {
				continue;
			}
			next_word_on_board.push([dir,word_number]);
		}
	}
}

function generateNextLetterPositionOnBoardZigzag(){
		//create a top right to bottom left list in which we will lay down words. FIFO
		//zigzag alternate top right to bottom left then bottom left to top right
		var x = 1;
		var y = -1;
		var divX = -1;
		var divY = 1;

		next_letter_position_on_board = [];
		do {
				//move cursor
				x = x + divX;
				y = y + divY;
				//test cursor position
				if ( (x < 0) && (y >= puzzle_height) ) {//bottom left corner
						divX = -divX; divY = -divY; //change directions
						x = 1;
						y = puzzle_height - 1;
				}
				if ( (x >= puzzle_width) && (y < 0) ) {//top right corner
						divX = -divX; divY = -divY; //change directions
						x = puzzle_width - 1;
						y = 1;
				}
				if (x < 0){//off left
						divX = -divX; divY = -divY; //change directions
						x = 0;
				}
				if (y < 0){//off top
						divX = -divX; divY = -divY; //change directions
						y = 0;
				}
				if (x >=  puzzle_width){//off right
						divX = -divX; divY = -divY; //change directions
						x =  puzzle_width - 1;
						y = y + 2;
				}
				if (y >=  puzzle_height){//off bottom
									divX = -divX; divY = -divY; //change directions
									x =  x + 2;
									y = puzzle_height - 1;
									}
				//process cursor position
				if (puzzle[y][x] != pad_char){
						next_letter_position_on_board.push([x,y]);
				}
  } 	while( (x != puzzle_width - 1) || (y != puzzle_height - 1) );
}

function generateNextLetterPositionsOnBoardDiag(){
	//create a top right to bottom left list in which we will lay down words. FIFO
	var x = 1;
	var y = -1;
	var divX = -1;
	var divY = 1;
	var diag_count;

	next_word_on_board = [];

	do { //move cursor
		x = x + divX;
		y = y + divY;

		if ((x < 0) || (y >= puzzle_height)) {
			diag_count++;
			x = diag_count;
			if (x >= puzzle_width - 1) {
				x = puzzle_width - 1;
				y = diag_count - x;
			} else {
				y = 0;
			}
		}
		//process cursor position
		if (puzzle[y][x] != pad_char) {
			//see if we are at start of word. If so add to list
			for (var dir = 0; dir < 2; dir++) {
				if (position_in_word[dir][y][x] == 0) { //first letter in word!
					next_letter_positions_on_board.push( [x,y] );
				}
			}
		}
	}
	while ((x < puzzle_width - 1) && (y < puzzle_height - 1));
}

function generateNextLetterPositionOnBoardFlat(){
//create right to left top to bottom list in which we will lay down words. FIFO
		var x = 0;
		var y = 0;

		next_letter_position_on_board = [];
		for (y = 0 ; y < puzzle_height ; y++){
     for (x = 0 ; x < puzzle_width ; x++){
							if (puzzle[y][x] != pad_char){
									next_letter_position_on_board.push([x,y]);
       }
     }
  }
}

function getCrossingWords(dir , word_number) {
	//input: word number and direction
	//output: [[crossing_word_number,crossing_word_number],[crossing_word_number,crossing_word_number], ...]
	var crossing_words = [];
	var x;
	var y;
	var crossing_word_number;

	var word_letter_positions = letter_positions_of_word[dir][word_number];
	word_letter_positions.forEach(function(letter_position) {
		x = letter_position[0];
		y = letter_position[1];
		crossing_word_dir = 1 - dir;

		//find and mark crossing words
		crossing_word_number = this_square_belongs_to_word_number[crossing_word_dir][y][x];
		if (crossing_word_number > 0) {
			crossing_words.push([crossing_word_dir , crossing_word_number]);
		}
	});
	return crossing_words;
}

function calculateOptimalBacktracks() {
	//letter backtrack
	//cycle through each letter cell, provided by next_letter_position_on_board_temp, and build : target_cells_for_letter_backtrack
	//optimal backtrack targets are all n,e,w,s letters of the horizontal and vertical word centered on the cell.
	//don't include our cell
	//we MUST only include cells that precede our cell in the walk path.
	//when using optimal backtrack, we use the naive backtrack and stop at the first encountered member of target_cells_for_letter_backtrack

	//word backtrack
	//cycle through all words on board, provided by next_word_on_board_temp, and build : target_words_for_word_backtrack
	//optimal backtrack targets are all crossing words, for now.... test and investigate later


	//from PERL version
	//touching_words_for_backtrack; #global as we need to backtrack to the first  member of it we encounter. if not == () we are in a backtrack state!

	//rule 1. All letters in the horizontal and vertical words (up to the failed letter) can affect the failure of laying a letter
	//rule 2. All crossing words of both the horizontal and vertical words of the failed letter can affect the failure of laying a letter
	//rule 3 Remove shadows by only keeping the intersection of rule 1 and 2
	//targetLettersForBackTrack{x failed letter}{y failed letter}{x}{y} = 1 #pre-generated for speed!

	var x, y, xx, yy;
	//var walk_cells_up_to_xy = [];
	var word_letter_positions;
	var cell_position;

	var next_letter_position_on_board_temp = JSON.parse(JSON.stringify(next_letter_position_on_board)); //backup as we are going to tear it up
	var next_word_on_board_temp = JSON.parse(JSON.stringify(next_word_on_board)); //backup as we are going to tear it up

	if (mode == "letter") {
		while (next_letter_position_on_board_temp.length != 0) {
			cell_position = next_letter_position_on_board_temp.shift(); //remove next letter position
			x = cell_position[0];
			y = cell_position[1];

			for (dir = 0; dir < 2; dir++) {
				//if (typeof walk_cells_up_to_xy === 'undefined') {
				//continue;
				//} //code will not work if walk_cells_up_to_xy is empty
				if (typeof this_square_belongs_to_word_number[dir][y][x] === 'undefined') {
					continue;
				} //no word
				let tsbtwn = this_square_belongs_to_word_number[dir][y][x];
				word_letter_positions = letter_positions_of_word[dir][tsbtwn];
				//is word_letter_positions in walk_cells_up_to_xy : use array intersection routine
				word_letter_positions.forEach(function(word_position) {
					xx = word_position[0];
					yy = word_position[1];
					var x_y = '' + x + '_' + y;
					var xx_yy = '' + xx + '_' + yy;
					if (x_y == xx_yy) {
						return;
					} //skip current cell as it should not be a backtrack destination
					//let val = JSON.stringify(word_position);
					//if (walk_cells_up_to_xy.includes(val)) {//only do previous walk cells
					//add to target_cells_for_letter_backtrack
					if (typeof target_cells_for_letter_backtrack[x_y] === 'undefined') {
						target_cells_for_letter_backtrack[x_y] = {};
					}
					target_cells_for_letter_backtrack[x_y][xx_yy] = true; //x_y is this cell and target _cells are stored in keys xx_yy!
					//}
				});
			}
			//walk_cells_up_to_xy.push(JSON.stringify(cell_position));
		}
	}

	//MUST backtrack to all crossing words, and all crossing words of those...
	if (mode == 'word') {
		while (next_word_on_board_temp.length != 0) { //for each word position
			let word_position = next_word_on_board_temp.shift(); //keep in subroutine unchaged as we may need to unshift on a recursive return
			let dir = word_position[0];
			let word_number = word_position[1];
			var d_w = '' + dir + '_' + word_number;
			if (typeof target_words_for_word_backtrack[d_w] === 'undefined') {
					target_words_for_word_backtrack[d_w] = {};
				}
			let word_positions = getCrossingWords(dir, word_number);

			word_positions.forEach(function(word_position) {
				let dir = word_position[0];
				let word_number = word_position[1];
				let d_w_temp = '' + dir + '_' + word_number;
				target_words_for_word_backtrack[d_w][d_w_temp] = 1; //add 1st set of crossing words
				//do 2nd level of crossing words
				let word_positions = getCrossingWords(dir, word_number);
				word_positions.forEach(function(word_position) {
					let dir = word_position[0];
					let word_number = word_position[1];
					let d_w_temp = '' + dir + '_' + word_number;
					target_words_for_word_backtrack[d_w][d_w_temp] = 1; //add 2st set of crossing words
					});
			});
		}//while end
	}
}

var letter_backtrack_source; //set to () to stop backtrack and set for backtrack $letterBackTrackSource{x} and  $letterBackTrackSource{y}
//async function recursiveLetters() {
function recursiveLetters() {
	//recursive try to lay down letters using @nextLetterPositionsOnBoard, this function will shift off, store and unshift if required
	//store locally the possible letters in  @possibleLetter
	//the next index in the list (@nextLetterPositionsOnBoard) is the next letter position we are trying to fill

	//recurse if we can't find possible letters (going forward) or run out of possible letters
	//next / loop if we can't lay a letter (word already used) and we have more possible letters to pick from
	//anytime we next / loop set to $unoccupied as we are processing (just in case)
	//anytime we recurse back (can't lay a letter or run out) a square we must unshift @nextLetterPositionsOnBoard , {x => $x, y => $y}; and return 0
	//if our recursive calls have returned from a failed letter, set $unoccupied (to try another letter) and next / loop to see if there are anymore possible letters for this square

	//note optimal recursion will not work if upper letter is part of a horizontal word ?????
	//the reason is that we may be backtracking due to a later letter in the upper horizontal word.
	//If we wipe that word out without trying ALL the combinations in that upper word we may be missing possible words in the horizontal word we are working on now
	//an exception is if it is the last letter of a horizontal word
	//so: only optimal up if:
	//1. the upper target letter it is not part of a horizontal word
	//2. the upper target letter is the last letter in a horizontal word
	//3. the letter that failed is in a single vertical word
	var x , y , x_y;
	var cell_position;
	var letters_that_fit = [];
	var popped_letter;
	var success = 0;//assume we failed to get in while loop
	var words_that_were_laid = [];

	recursive_count++;
	printProcessing();

	//moving forward
	letter_backtrack_source = undefined; //clear global indicating that we are moving forward and have cleared the backtrack state
	if (next_letter_position_on_board.length == 0) {
		return true;
		} //we have filled all the possible letter positions, we are done. This breaks us out of all recursive  success loops
	forward_count++; //count forward moving calls
	cell_position = next_letter_position_on_board.shift(); //keep cell_position in subroutine unchanged as we may need to unshift on a recursive return
	x = cell_position[0];
	y = cell_position[1];

	//get possible letters for this cell
	if (arg_shuffle) {
		letters_that_fit = shuffle(lettersPossibleAtCell(x, y));
	} else {
		letters_that_fit = lettersPossibleAtCell(x, y).sort();
	}

	while (success == 0) {
		if (letters_that_fit.length == 0) { //there are NO possible letters for this cell left. BACTRACK start
			next_letter_position_on_board.unshift(cell_position); //always unshift our current position back on to next_letter_position_on_board before backtracking
			//next_letter_position_on_board.unshift([x, y]); //always unshift our current position back on to next_letter_position_on_board before backtracking
			if (arg_optimalbacktrack) { //optimal backtrack setup
				if (typeof letter_backtrack_source === 'undefined') { //only set for optimal if we are not already in an optimal backtrack mode
					x_y = '' + x + '_' + y;
					if (typeof target_cells_for_letter_backtrack[x_y] !== 'undefined') { //check to see if there are any backtrack targets possible for $x $y first
						//letter_backtrack_source = [x , y]; //set source/start cell for optimal bactracking
						letter_backtrack_source = x_y; //set source/start cell for optimal bactracking
					}
				}
			}
			naive_backtrack++; //really should be called all_backtracks
			return false; //start our backtrack : naive & optimal
		}

		//try the next letter that fit in this location
		popped_letter = letters_that_fit.pop();

		words_that_were_laid = setXY(x , y , popped_letter); //lay a letter and save any horiz or vert words that were laid
		if (! words_that_were_laid) { //if words_that_were_laid = false, a horizontal or vertical word was already been laid/used in the puzzle. so backtrack
			continue;
		}

		//we laid a letter in this cell so try and fill the next cell
		success = recursiveLetters(); //lay next letter in the next position. true means puzzle is complete, false means we are backtracking
		//await recursiveLetters().then(function(value){ success = value; }); //lay next letter in the next position. true means puzzle is complete, false means we are backtracking
		//after a failed (or the puzzle is completed), we will be here
		if (success == true) {
			return true;
			} //test to see if board was filled, this is where we return out of all recursive calls successfully. it was triggered a few lines above.

		//------------------------------------------------------------

		//success == false , so we have been backtracking to...
		//if we are here, the last recursive attempt to lay a letter failed

		//delete words_that_are_inserted[words_that_were_laid[0]]; //if a word was laid before, reverse that
		//delete words_that_are_inserted[words_that_were_laid[1]];
		setXY(x, y, unoccupied); //failed so reset letter to unoccupied
		//exclusively optimal backtrack check and processing
		if (typeof letter_backtrack_source !== 'undefined') { //we are doing an optimal backtrack
			//xx_yy = '' + letter_backtrack_source[0] + '_' + letter_backtrack_source[1];
			x_y = '' + x + '_' + y;
			if (target_cells_for_letter_backtrack[letter_backtrack_source][x_y]) { //we have hit the first optimal backtrack target.
				letter_backtrack_source = undefined; //turn off optimal backtrack
			} else {//we did not find optimal backtrack target yet
				next_letter_position_on_board.unshift(cell_position);//always unshift our current position back on to @nextLetterPositionsOnBoard when we return!
				//next_letter_position_on_board.unshift([x, y]); //always unshift our current position back on to @nextLetterPositionsOnBoard when we return!
				optimal_backtrack++;
				return false; //go back one to see if it is optimal backtrack target
			}
		}
	} //end while
	tt = 9;
	document.alert('Error: Recursive, we should never get here.');
}

function lettersPossibleAtCell(x, y) {
	//at the input position x,y and given the prefix of a word for a mask, find and return all possible letters
	var letters_that_fit = [];
	var word_number;
	var possible_letters_HV = [];
	var mask = [];

	for (dir = 0; dir < 2; dir++) {
		if (typeof this_square_belongs_to_word_number[dir][y][x] === 'undefined') {
			possible_letters_HV[dir] = [];
			continue;
		} //no word here
		word_number = this_square_belongs_to_word_number[dir][y][x];
		mask[dir] = all_masks_on_board[dir][word_number];
		possible_letters_HV[dir] = Object.keys(linear_word_search[ mask[dir] ]);
	}

	if (possible_letters_HV[0].length && possible_letters_HV[1].length) { //intersect horiz and vert letters
		letters_that_fit = possible_letters_HV[0].filter(function(item) {
			if (possible_letters_HV[1].includes(item)) {
				return true;
			}
		});
	} else { //one of these might have letters
		letters_that_fit.push(possible_letters_HV[0]);
		letters_that_fit.push(possible_letters_HV[1]);

	}
	return letters_that_fit;
}

function shuffle(array) {
	var m = array.length , t , i;
	while (m) { //while there remain elements to shuffle
		// Pick a remaining element
		i = Math.floor(Math.random() * m--);
		// And swap it with the current element.
		//or [array[i], array[m]] = [array[m], array[i]];
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}

function setXY(x, y, letter) {
	//see if potential mask equates to a word already laid. if true return false
	//set cell, horiz mask , vert mask
	//return : true if mask laid , false if mask or word already used , [full words laid]

	var word_number; // = this_square_belongs_to_word_number;
	var position;
	var mask = [];
	var dir;
	//var words_laid; //leave undefined and any define if we need to push a mask to return

	//get masks, see if unique mask (equating to a word) or full word is already laid, if so return false
	for (dir = 0; dir < 2; dir++) {
		if (typeof this_square_belongs_to_word_number[dir][y][x] === 'undefined') {
			continue;
		} //no word here
		word_number = this_square_belongs_to_word_number[dir][y][x];
		position = position_in_word[dir][y][x];
		mask[dir] = all_masks_on_board[dir][word_number];

		if( (mode == 'word') && (letter == unoccupied) ) { //remove mask from words_that_are_inserted. It may be full.
			delete words_that_are_inserted[mask[dir]]; //remove mask from words_that_are_inserted. It may be full.
		}

		//add letter to mask
		mask[dir] = mask[dir].substring(0, position) + letter + mask[dir].substring(position + 1);

		if (mode == 'letter') {//only do isWordAlreadyUsed if we are in letter mode! Word mode is checked in recursive routine
			if (letter != unoccupied) { //no need if we are setting unoccupied
				if (isWordAlreadyUsed(mask[dir])) { //any word already used return false
					return false;
				}
			}
		}
		if( (mode == 'word') && (! arg_simplewordmasksearch) ){ //if not using simple word mode then we can add all MASKS as all full crossing words have been tested
			if( ! mask[dir].includes(unoccupied) ){//full mask add to words_that_are_inserted
			words_that_are_inserted[mask[dir]] = 1;
			}
		}

	}

	//set cell then mask(s)
	puzzle[y][x] = letter; //keep grid up to date
	for (dir = 0; dir < 2; dir++) {
		if (typeof this_square_belongs_to_word_number[dir][y][x] === 'undefined') {
			continue;
		} //no word here
		word_number = this_square_belongs_to_word_number[dir][y][x];
		all_masks_on_board[dir][word_number] = mask[dir];
		//is it a full word?
		/*
		if (!mask[dir].includes(unoccupied)) { //if mask full word add to words_laid and also to wordsThatAreInserted
			//words_that_are_inserted[mask[dir]] = 1;
			if (typeof words_laid === 'undefined') {
				words_laid = [];
			}
			words_laid.push(mask[dir]);
		}
		*/
	}

	//if (typeof words_laid !== 'undefined') {
		//return words_laid;
	//}
	return true;
}

function isWordAlreadyUsed(mask) {
//input of mask WORooooo
//check to see if all possible letters 'o' have only one possible letter. If so, only one word can be created. See if this word has been used.
//saves us from filling in a whole word on letter fills only to have to backtrack

//WHICH IS FASTER
/*
	var next_letters;
	let pattern =  new RegExp(`${unoccupied}`, 'g'); // /${unoccupied}/g;
	while ( pattern.test(mask) ) { //see if we get single letters until end of word
			next_letters = Object.keys(linear_word_search[ mask ]);
			if (next_letters.length > 1){ //multiple words possible for mask.
				return 0;
				}
			mask = mask.replace( unoccupied , next_letters[0]); //replace first blank with the single letter
			}
	//only one word is possible for mask at this point
	//but has it been used?
	if (typeof words_that_are_inserted[mask] !== 'undefined') { return 1; }
	else {return 0;}
*/

	var list_of_words = wordsFromMask(mask);
	if(list_of_words.length == 1){//only one word is possible
		var the_word = list_of_words.pop();
		if (typeof words_that_are_inserted[the_word] !== 'undefined') { //it was used
			return true;
		}
		else {
			return false;
		}
	}
	else{
		return false;
	}
}

var word_backtrack_source; //set to () to stop backtrack and set for backtrack $letterBackTrackSource{x} and  $letterBackTrackSource{y}
//var words_that_must_be_laid; // true, false , or list of words that MUST be laid if we continue.
//it be added to by wordsFromLetterLists for unique words used in and placeMaskOnBoard to see if word(s) have already been used
function recursiveWords() {
	//recursive try to lay down words using @nextWordOnBoard, will shift off, store and unshift if required
	//store locally the possible words in  @possibleLetterLists
	//in just the next index in a list (@NextWordPositionsOnBoard) of word position we are trying to fill

	if(next_word_on_board.length == 0){
		return true;
	}
	//alternate done....?
	if (Object.keys(words_that_are_inserted).length == (number_of_HV_words[dir_across] + number_of_HV_words[dir_down]) ) {
		k=9;//return true;
	} //if we have filled all the possible words, we are done. This breaks us out of all recursive  success loops

	var words_that_fit;
	var popped_word;
	word_backtrack_source = undefined; //clear global indicating that we are moving forward and have cleared the backtrack state
	var word_position = next_word_on_board.shift(); //keep in subroutine unchanged as we may need to unshift on a recursive return
	var dir = word_position[0];
	var word_number = word_position[1];
	var d_w = '' + dir + '_' + word_number;

	recursive_count++;
	printProcessing();

	//get all possible words for mask
	var mask = all_masks_on_board[dir][word_number]; // get WORD or MASK at this crossword position
	if (arg_simplewordmasksearch) {
		//simple one. 0.0002 sec a call.  better for less cross links?
		//ignore crossing words as future mask checks will find the failures/errors. not true for some walks as there msay be no crossword checking!
		//it will only work well with alternating across and down checks
		if (arg_shuffle) {
			words_that_fit = shuffle(wordsFromMask(mask));
		} else {
			words_that_fit = shuffle(wordsFromMask(mask)).sort();
		}
	} else {
		//complex one 0.05 sec a call. better for more crosslinks?
		var possibleLetterLists = letterListsFor(dir, word_number);
		if (arg_shuffle) {
			words_that_fit = shuffle(wordsFromLetterLists(possibleLetterLists));
		} else {
			words_that_fit = shuffle(wordsFromLetterLists(possibleLetterLists)).sort();
		}
	}

	var success = 0;
	while (success == 0) {
		//if(mask != popped_word){//go forward to recursiveWord as this word was laid and is ok mask == popped_word
			if (words_that_fit.length == 0) { //are there any possible words? If no backtrack
				next_word_on_board.unshift(word_position);
				if (arg_optimalbacktrack) {
					if (typeof word_backtrack_source === 'undefined') { //only set for optimal if we are not already in an optimal backtrack mode
						//d_w = '' + dir + '_' + word_number;
						if (typeof target_words_for_word_backtrack[d_w] !== 'undefined') { //check to see if there are any backtrack targets possible for dir word_number first
							word_backtrack_source = d_w; //set source/start cell for optimal bactracking
						}
					}
				}
				naive_backtrack++; //really should be called all_backtracks
				return false;
			} //no words so fail

			//try the next word that fit in this location
			popped_word = words_that_fit.pop();

		if (arg_simplewordmasksearch) {//simple
			var xwords_ok = letterListsFor(dir , word_number); //if xwords are ok, then we should not get []
			if(xwords_ok.length != 0){ //all crosswords are ok, so try next recursive word.
				placeMaskOnBoard(dir, word_number, popped_word);
				success = recursiveWords(); //lay next word in the next position
			}
			else{}//just loop to try next_possible_word
		}
		else{//complex
			placeMaskOnBoard(dir, word_number, popped_word);
			success = recursiveWords(); //lay next word in the next position
		}

		//success = recursiveWords(); //lay next word in the next position
		if (success == true) {
			return true;
		} //board is filled, return out of all recursive calls successfuly
		//-------------------------------------------------------------------------------
		//if we are here, the last recursive attempt to lay a word failed.
		//OR
		//the last simple search word will fail based on all crossing words
		//OR
		//we are in an optimal backtrack run
		//So we are backtracking.

		placeMaskOnBoard(dir, word_number, mask); //failed so reset word to previous mask

		//exclusively optimal backtrack check and processing
		if (typeof word_backtrack_source !== 'undefined') { //we are doing an optimal backtrack
			//d_w2 = '' + dir + '_' + word_number;
			if (target_words_for_word_backtrack[word_backtrack_source][d_w]) { //we have hit the first optimal backtrack target.
				word_backtrack_source = undefined; //turn off optimal backtrack
			}
			else { //we did not find optimal backtrack target yet
				next_word_on_board.unshift(word_position); //always unshift our current position back on to @nextLetterPositionsOnBoard when we return!
				optimal_backtrack++;
				return false; //go back one to see if it is optimal backtrack target
			}
		}
	} //end while loop
document.alert('Error: Recursive, we should never get here.');
//return true;
}

var try_another_word_loop = 0;
function recursiveWords2() {
	//recursive try to lay down words using @nextWordOnBoard, will shift off, store and unshift if required
	//store locally the possible words in  @possibleLetterLists
	//in just the next index in a list (@NextWordPositionsOnBoard) of word position we are trying to fill
	if (next_word_on_board.length == 0) {
		return true;
	}
	//alternate done....?
	if (Object.keys(words_that_are_inserted).length == (number_of_HV_words[dir_across] + number_of_HV_words[dir_down])) {
		k = 9; //return true;
	} //if we have filled all the possible words, we are done. This breaks us out of all recursive  success loops

	var words_that_fit;
	var popped_word;
	word_backtrack_source = undefined; //clear global indicating that we are moving forward and have cleared the backtrack state
	var word_position = next_word_on_board.shift(); //keep in subroutine unchanged as we may need to unshift on a recursive return
	var dir = word_position[0];
	var word_number = word_position[1];
	var d_w = '' + dir + '_' + word_number;

	recursive_count++;
	printProcessing();

	//get all possible words for mask
	var mask = all_masks_on_board[dir][word_number]; // get WORD or MASK at this crossword position
	if (arg_simplewordmasksearch) {
		//simple one. 0.0002 sec a call.  better for less cross links?
		//ignore crossing words as future mask checks will find the failures/errors. not true for some walks as there msay be no crossword checking!
		//it will only work well with alternating across and down checks
		if (arg_shuffle) {
			words_that_fit = shuffle(wordsFromMask(mask));
		} else {
			words_that_fit = shuffle(wordsFromMask(mask)).sort();
		}
	} else {
		//complex one 0.05 sec a call. better for more crosslinks?
		var possibleLetterLists = letterListsFor(dir, word_number);
		if (arg_shuffle) {
			words_that_fit = shuffle(wordsFromLetterLists(possibleLetterLists));
		} else {
			words_that_fit = shuffle(wordsFromLetterLists(possibleLetterLists)).sort();
		}
	}

	var first_run = true;
	var success = 0;
	while (success == 0) {

		if (!first_run) {
			//REQUIRED, as setXY will clear words_that_are_inserted
			//only do this if we have failed to lay a word in this loop
			placeMaskOnBoard(dir, word_number, mask);
		} //failed so reset word to previous mask
		first_run = false; //we are in the loop and running

		//exclusively optimal backtrack check and processing
		//note that optimal is supposed to be able to backtrack to a target and not worry about superfluous words_that_fit
		if (typeof word_backtrack_source !== 'undefined') { //we are doing an optimal backtrack
			if (target_words_for_word_backtrack[word_backtrack_source][d_w]) { //we have hit the first optimal backtrack target.
				word_backtrack_source = undefined; //turn off optimal backtrack
			} else { //we did not find optimal backtrack target yet
				next_word_on_board.unshift(word_position); //always unshift our current position back on to @nextLetterPositionsOnBoard when we return!
				optimal_backtrack++;
				return false; //go back one to see if it is optimal backtrack target
			}
		}

		//naive backtrack and test for optimal
		if (words_that_fit.length == 0) { //are there any possible words? If no start backtrack
			next_word_on_board.unshift(word_position);
			if (arg_optimalbacktrack) {
				if (typeof word_backtrack_source === 'undefined') { //only set for optimal if we are not already in an optimal backtrack mode
					if (typeof target_words_for_word_backtrack[d_w] !== 'undefined') { //check to see if there are any backtrack targets possible for dir word_number first
						word_backtrack_source = d_w; //set source/start cell for optimal bactracking
						//optimal_backtrack++;
						//return false; //go back one to see if it is optimal backtrack target
					}
				}
			}
			naive_backtrack++; //really should be called all_backtracks
			return false;
		} //no words so fail

		//word_backtrack_source = undefined; //turn off optimal backtrack

		//try the next word that fit in this location
		popped_word = words_that_fit.pop();

		//tests on what to do with popped_word. order is important
		var xwords_ok = false; //assume
		//arg_simplewordmasksearch stare we want to check if all crossing words are ok, or not
		if(arg_simplewordmasksearch){
			xwords_ok = letterListsFor(dir, word_number); //if xwords are ok, then we should not get []
			if(xwords_ok){
				if (words_that_are_inserted[popped_word]){
						if (mask == popped_word) {//it is the word we are checking. don't worry about it
							success = recursiveWords2();
						}
						else{//the word is placed elsewhere. worry about it
							//loop
						}
				}
				else{
					placeMaskOnBoard(dir, word_number, popped_word);
					success = recursiveWords2();
				}
			}
			else{//crossing words do not fit
				//loop
			}
		}
		else{//complex
			if (words_that_are_inserted[popped_word]){
					if (mask == popped_word) {//it is the word we are checking. don't worry about it
						success = recursiveWords2();
					}
					else{//the word is placed elsewhere. worry about it
						//loop
					}
			}
			else{
				placeMaskOnBoard(dir, word_number, popped_word);
				success = recursiveWords2();
			}
		}

		try_another_word_loop++;
	} //end while loop
	return true;
}

function wordsFromMask(mask){
//mask letters should be capitalized
//input: A_PL_ where _ will be whatever $unoccupied is
//output list of words that match the input mask
//var word_list;
var word_length = mask.length;

var pattern =  new RegExp( unoccupied , 'g');
//mask = mask.replace(pattern , '.'); //make a mask of 'GO$unoccupiedT' into 'GO.T' for the regexp
mask = mask.replace(pattern , '\\w'); //make a mask of 'GO$unoccupiedT' into 'GO.T' for the regexp

//need to filter out wordsThatAreInserted{$popWord} == 1 below if ( wordsThatAreInserted{$popWord} == 1 )
//note that we need to return an empty list if the word is already inserted see:  else {()} If we do not, the map will return an empty word in the middle of the list which will pooch our code later.

pattern =  new RegExp(`${mask}`, 'g'); // /${mask}/g;
var possible_words_array = words_of_length_string[word_length].match(pattern);
if(possible_words_array === null){
	possible_words_array = [];
}
return possible_words_array;
}

function placeMaskOnBoard(dir , word_number , mask){ //place mask, add letters and update crossing masks
letter_positions_of_word[dir][word_number].forEach(function(letter_position , index){
        x = letter_position[0];
        y = letter_position[1];
        var letter = mask.charAt(index); //letter from word
        setXY(x,y,letter); //does puzzle letter placement and adds to all_masks_on_board
		if(arg_simplewordmasksearch){ //if using simple word mode then we only add this MASKS as crossing words have not been tested
			if( ! mask.includes(unoccupied) ){//full mask add to words_that_are_inserted
			words_that_are_inserted[mask] = 1;
			}
		}
	});
return;
}

function letterListsFor(dir , word_number){
//input: word number and direction
//output: list of possible letters for each position in word based on crossing word masks
//if a letter position has no members, so what. keep going but make sure that the list for that letter = ()
//var word_length = all_masks_on_board[dir][word_number].length;
var word_letter_positions = letter_positions_of_word[dir][word_number];
var letter_lists = [];
var nTh_letters;

for(var i = 0 ; i < word_letter_positions.length ; i++){
//word_letter_positions.forEach(function(letter_position){
	letter_position = word_letter_positions[i];
	var x = letter_position[0];
	var y = letter_position[1];
	var crossing_word_dir =  1 - dir;

	var crossing_word_number = this_square_belongs_to_word_number[crossing_word_dir][y][x];
	var crossing_word_mask = all_masks_on_board[crossing_word_dir][crossing_word_number];

	var  nTh_letter_position = position_in_word[crossing_word_dir][y][x];
	var current_letter = crossing_word_mask.charAt(nTh_letter_position);

	nTh_letters = [];
	var pattern =  new RegExp('[A-Z]' , 'g');
	if ( current_letter.search(pattern) == 0 ) { //if a letter is already in the crossing spot, use it.
       nTh_letters = [current_letter];
    }
	if (current_letter == unoccupied){
       var words_from_mask = wordsFromMask(crossing_word_mask);
       nTh_letters = nThLettersFromListOfWords(nTh_letter_position , words_from_mask);
	}
	if (crossing_word_number === 'undefined') { //there is no crossing word at this letter location so return a single $unoccupied 'o' to indicate that a word can still be made as any letter can go here!
       //@nThLetters = ($unoccupied);
       nTh_letters = [pads_either_side];
    }
	if( nTh_letters.length == 0) //used to break out earlier for small speed increase. If a letter position has no letters, WordsFromLetterList will fail anyway. Just return empty list
        {
        letter_lists = [];
        return letter_lists;
    }
	letter_lists.push(nTh_letters);
	//});
	}
return letter_lists;
}

function nThLettersFromListOfWords(nTh , words){ //tested
//input:
//a number representing a letter position in words
//reference to an array of words all the same length
//output an array of all letters at the requested position from each word (no duplicates!)

var letters = {};
var letter;

words.forEach(function(word){
	//if(word.length <= nth ) {die("@words $count word word of length  too short nth $nth")}
	letter = word.charAt(nTh);
	letters[letter] = 1; //no duplicates so associative array
	});
return Object.keys(letters);
}

function wordsFromLetterLists(letter_lists){
//input list of referenced lists containing possible letters for each position in a word
//(['C','D','F','T','Z'] , ['E','R','T','Y','O', 'A'] , ['T','R','E','W','Q','Z'])
//(['C','D','F','T','Z'] , [$padsEitherSide] , ['T','R','E','W','Q','Z'])
//if input is () no letters were available from LetterListFor so return ()
//if a letter position has no potential letters (it == ()) return () unless it has a pad on either side!
//$padsEitherSide note in this case, there will be no letters returned, BUT words still can be made as there is no crossing word to block it. So we assume all letters are possible here [A-Z]
//output list of words that can be made with said letters

var word_length = letter_lists.length;

if (letter_lists.length == 0) {
	return [];
	} //required as LetterListsFor will return [] if there are no possible letters!

//regexp version from 2x  up to 20x faster! long lists are fast
var regexp_string = '';
//var impossible_word = false; //assume
for(var i = 0 ; i < letter_lists.length ; i++){ //for each letter's position
	letter_list = letter_lists[i];
        if(letter_list[0] == pads_either_side) {
			letter_list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
		} //it can be ANY letter (no crossing word) [A..Z]
        else{
			if (letter_list.length == 0) {
				return [];
			}//no possible letters here, return an empty list of words
		}
        regexp_string = regexp_string + '[' + letter_list.join('') + ']'; //regexp_string will be /[ABC][HGR][OHR]..../
}

// (wordsOfLengthString[wordLength] =~ /$regexpstring/g) returns all possible words
//look for words already used and ignore using map!
//@possibleWords = map( { if ( wordsThatAreInserted{$_} == 0 ) {$_} else {()} }   (wordsOfLengthString[wordLength] =~ /$regexpstring/g) );
//return @possibleWords; # speed up by direct output!
var pattern =  new RegExp(`${regexp_string}`, 'g');
var possible_words_array = words_of_length_string[word_length].match(pattern);
if(possible_words_array === null){
	possible_words_array = [];
}
return possible_words_array; //just return full array, we check if words are layed in recursive routine
}

function numberClueList() {
var x = -1;
var y = -1;
//var word;
var hints;
var clues = [];

all_masks_on_board.forEach(function(item , dir){
	hints = '';
	all_masks_on_board[dir].forEach(function(word , word_number){ //for all our words on the board
		//get clue(s) for this word
		var first_2_leters = word.substring(0, 2);
		var directory = "./wordlists/" + arg_wordfile + "/clues/";
		var filename = directory + "_" + first_2_leters + ".clu";
		var clue_list_text = readStringFromFileAtPath(filename);
		var clue_list_array = clue_list_text.split(/\r?\n|\r|\n/g); //split on lines into array
		if (clue_list_array[clue_list_array.length - 1].trim() == '') {
			clue_list_array.pop();
		} //remove last line if empty
		clues = [];//
		clue_list_array.forEach(function(line){
			var clue_temp = line.split('|');
			if(clue_temp[0] == word){
				clues.push(clue_temp[1]);
			}
		});
		//choose a random clue
		var clue = clues[ Math.floor(Math.random() * clues.length) ];
		//place it is global associative array
        clues[word] = clue;

		x = letter_positions_of_word[dir][word_number][0][0];
		y = letter_positions_of_word[dir][word_number][0][1];

		hints += `
			${word_number}. <a href="#self" id='[${dir},${word_number},"cell"]' class="clues" ONCLICK="choose_clue(this.id);">${clues[word]}</a>
			&nbsp;<font size=-2><a href="http://www.google.ca/search?q=${clues[word]}" target="_blank">google</a></font>
			&nbsp;&nbsp;&nbsp;&nbsp;

			<font><i>
			<span id='show${word}' ONCLICK="hide2('show${word}');show2('clue${word}');show2('google${word}');" >
			 <a href="#" ONCLICK="return false">show</a>
			 </span>
			<span id='clue${word}' ONCLICK="hide2('clue${word}');hide2('google${word}');show2('show${word}');" style="display:none;">
			 <a href="#" ONCLICK="return false">${word}</a>
			 </span>
			<span id='google${word}'  style="display:none;">
			 <font size=-2><a href="http://www.google.ca/search?q=${word}" target="_blank">google</a></font>
			 </span>
			<i></font>
			</br>
			<script>hide2('clue${word}');hide2('google${word}');</script>
			`;
		if (dir == 0) {document.getElementById('across').innerHTML = hints;}
		if (dir == 1) {document.getElementById('down').innerHTML = hints;}
	});
});
}

function printSolvedPuzzle(){
var temp;
var y;
var x;

temp = "<table cellspacing='0' CLASS='tableclass'>";
for (y = 0; y < puzzle_height; y++){
    temp += "<tr>";
	for (x = 0; x < puzzle_width; x++){
		if(puzzle[y][x] == pad_char){
			temp += "<td CLASS='tdblackclass'></td>";
			continue;
			}
        if (puzzle[y][x] == unoccupied){
			temp += "<td CLASS='tdwhiteclass'>&nbsp</td>";
			}
        if( puzzle[y][x].search(/[A-Z1-9]/) >= 0){
			temp += `<td CLASS='tdwhiteclass'>${puzzle[y][x]}</td>`;
			}
    }
    temp += "</tr>\n";
        }
temp += "</table>\n";
return temp;
}

var console_log_count = 0;
function printProcessing() {
//my $message = $_[0];
var x , y;
var line;
var string = '<pre>';
var time = ( Date.now() - start_time ) / 1000;

//open(my $processing, ">processing.txt") or die "Can't open : $!";

//limit script run time!
//if (time > timelimit){
     //&PrintResults( qq| Time limit exceeded | );
     //&Quit( "Time limit exceeded<br>\n\n" );
  //   }

string += "\n";
//string += "Loops per Sec: " . $recursiveCount / (time + 1 - $timeForCrossword); #print time to create crosword
string += "\n";

for (y = 0 ; y < puzzle_height ; y++){
	line = '';
	for (x = 0 ; x < puzzle_width ; x++) {
        line = line + puzzle[y][x];
    }
	string +=  line;
	string += "\n";

}

string +=  "\n";
string += "Time: " + time; //#print time to create crossword
string += "\n";
string += "Recursive calls: " + recursive_count; //print time to create crossword
string += "\n";
string += "Sec per Recursive call: " + (time / recursive_count); //print time to create crossword
string += "\n";
string +=  "Recursive calls per Sec: " + (recursive_count / time); //print time to create crossword
string += "\n";
string += "optimalBacktrack:" + optimal_backtrack ;
string += "\n";
string += "naive_backtrack:" + naive_backtrack;
string += "\n";
string += "try_another_word_loop:" + try_another_word_loop;
string += "\n";
string += "</pre>";

document.getElementById('workspace').innerHTML = string;
console.log(string);
console_log_count++;
if(console_log_count > 10000){
	console.clear();
	console_log_count = 0;
	} //if we don't it can blank out completely

//setTimeout( printProcessing , 1000);
}

function printPuzzle(){
  var temp , temp3 , temp4;
  var x , y , dir;
  var temp_puzzle = [];
  var word;
  var direction;

  temp = "<table cellspacing='0' cellpadding='0' CLASS='tableclass'>";
    for(y = 0; y < puzzle_height; y++){
        temp += "<tr>";
        for (x = 0; x < puzzle_width; x++){
            temp3 = '';
            if(typeof temp_puzzle[y] === 'undefined'){temp_puzzle[y] = [];}
            temp_puzzle[y][x] = puzzle[y][x]; //mimic filled in puzzle
            for (dir = 0 ; dir < 2 ; dir++){
                if (typeof position_in_word[dir][y][x] === 'undefined'){continue;} //not a word.
                if (position_in_word[dir][y][x] == 0){  //we are at start of word so there will be a number here. place that number
                    temp_puzzle[y][x] = this_square_belongs_to_word_number[dir][y][x];
                }

                //build a hover clue text for each square
                word = all_masks_on_board[dir][ this_square_belongs_to_word_number[dir][y][x] ];
                if (typeof word !== 'undefined'){
                  if (dir == dir_across) {direction = 'Across';}
                  if (dir == dir_down) {direction = 'Down';}
                  //temp3 += "direction: $clues{word} \n";
                  //temp3 =~ s/[\'\"]//g; //remove quotes from title s it is in a tag
                }
            }

		temp4 = 'choose_cell(this.id);'; //new

        //lay down table stuff here

        //black square
        if(puzzle[y][x] == pad_char){ //make sure our page width is fixed
            temp += "<td CLASS='tdblackclass'><spacer width='20 pt'></td>";
        }

          //number square
          if(typeof temp_puzzle[y][x] === 'number'){
            temp += ` <TD VALIGN='TOP' ALIGN='LEFT' CLASS='tdnumberclass'>
            <DIV  style='position: absolute; z-index: 2;'>${temp_puzzle[y][x]}</DIV>
            <TABLE CELLPADDING="0" CELLSPACING="0">
              <TBODY>
                <TR>
                <TD title='${temp3}' CLASS='tdwhiteclass' ID='[${x},${y}]'
                ONCLICK='${temp4}' VALIGN='middle' WIDTH='20' ALIGN='center'
                HEIGHT='25'>&nbsp;</TD>
                </TR>
              </TBODY>
            </TABLE>
            </TD> `;
          }

          //unoccupied square, but not a pad_char
          if( (typeof temp_puzzle[y][x] === 'string') && (temp_puzzle[y][x] != pad_char) ){
            temp += ` <td title='${temp3}' ID='[${x},${y}]' CLASS='tdwhiteclass' ONCLICK='${temp4}'>&nbsp;</td> `;
            }
        }
    temp += "</tr>\n";
    }
temp += "</table>\n";
return temp;
}

//--------------------------------------
//puzzle navigation functions
//---------------------------------------

var forever = new Date('October 17, 2030 03:24:00'); //use in cookies
//var isAClickableClass['tdwordselectedclass'] = 1;
//isAClickableClass['tdwhiteclass'] = 1;
var isAClickableClass = {tdwordselectedclass:1 , tdwhiteclass:1 , tdselectedclass:1};

function setCellsFromCookies(){
	var theCookies = document.cookie.split(';');
    //var aString = '';
    for (var i = 0 ; i < theCookies.length ; i++) {
		var mycookie = theCookies[i].split('=');
		var theletter = mycookie[1];
		theletter = theletter.trim();
		var thecell = mycookie[0];
		thecell = thecell.trim();
		//is it a cell???
		if (mycookie[0].indexOf("cell") != -1) {
			document.getElementById(thecell).innerHTML = theletter;
			}
   }
}

function hide2(szDivID)
{
document.getElementById(szDivID).style.display =  "none";
}

function show2(szDivID)
{
document.getElementById(szDivID).style.display = "inline";
}

function ToggleHV(){
	horizvert = 1 - horizvert;
}

function ClearBox()
{
if (CurrentFocus != "") {document.getElementById(CurrentFocus).className = CurrentClass;} //restore the class name to white
}

function HighlightBox(cell)
{
CurrentClass = document.getElementById(cell).className; //store the class name of the square in the process of being focused
document.getElementById(cell).className = 'tdselectedclass'; //select/focus the square
CurrentFocus = document.getElementById(cell).getAttribute('ID');
}

function HighlightNextBox(){
var xpos = CurrentPos[0];
var ypos = CurrentPos[1];
var cell = "[" + xpos + "," + ypos + "]";

ClearBox(cell);
NthPosition++;
if (NthPosition >= LetterPosArray.length) {NthPosition = 0;}
xpos = LetterPosArray[NthPosition][0];
ypos = LetterPosArray[NthPosition][1];
cell = "[" + xpos + "," + ypos + "]";
HighlightBox(cell);
}

function HighlightClue(id){
if (OldClue != ""){
	document.getElementById(OldClue).className = 'cluesCleared';
	} //clear old clue

document.getElementById(id).className = 'cluesSelected'; //select/focus the clue
OldClue = id;
}

function HighlightWord(LetterPosArrayArg){
	OldLetterPosArray.forEach(function(cell_pos){
		var x = cell_pos[0];
		var y = cell_pos[1];
		var id = '[' + x + ',' + y + ']';
		document.getElementById(id).className = 'tdwhiteclass';
		});

	LetterPosArrayArg.forEach(function(cell_pos){
		var x = cell_pos[0];
		var y = cell_pos[1];
		var id = '[' + x + ',' + y + ']';
		document.getElementById(id).className = 'tdwordselectedclass';
		});
	OldLetterPosArray = JSON.parse(JSON.stringify(LetterPosArrayArg)); //copy array
}

function choose_clue( id ){//id is [dir,word_number]
	var id_array = JSON.parse(id);
	var dir = id_array[0];
	var word_number =   id_array[1];
	HighlightClue(id);
	LetterPosArray = letter_positions_of_word[dir][word_number];
	HighlightWord(LetterPosArray);
	//1st cell
	NthPosition = 0;
	cell_id = '[' + LetterPosArray[0][0] + ',' + LetterPosArray[0][1] + ']';
	HighlightBox(cell_id);
}

function choose_cell(id){ //id is '[x,y]'
	var id_array = JSON.parse(id);
	var x = id_array[0];
	var y = id_array[1];
	var dir = horizvert;

	ClearBox();//clear old box
	var word_number = this_square_belongs_to_word_number[dir][y][x];
	//var word = all_masks_on_board[dir][word_number];
	id_str = '[' + dir + ',' + word_number + ',"cell"]';
	HighlightClue(id_str);
	LetterPosArray = letter_positions_of_word[dir][word_number];
	HighlightWord(LetterPosArray);
	HighlightBox(id);
	NthPosition = position_in_word[dir][y][x];
	ToggleHV();
	CurrentPos = [x,y];
}

//---------------------------------------

function send_cell_update(k){
//first see if it is an arrow key
var xpos = CurrentPos[0];
var ypos = CurrentPos[1];
//move cell. if square is clickable run document.getElementById(cell).onclick() and return, else,return
if (k == 37) { xpos-- ;} //left
if (k == 38) { ypos-- ;} //up
if (k == 39) { xpos++ ;} //right
if (k == 40) { ypos++ ;} //down
if (k == 191) {  } // forward slash. just change horiz and vert
if ( (k == 37) || (k == 38) || (k == 39) || (k == 40) || (k == 191) ) { //arrow keys
	 cell = "[" + xpos + "," + ypos + "]";
	 if (isAClickableClass[document.getElementById(cell).className] == 1) {
		ToggleHV(); //double toggle so it doesn't change
	 	document.getElementById(cell).onclick();
		return false;
		}
    else {return false;}
	 }

//no arrow keys. lay the letter
var letter = String.fromCharCode(k);
document.getElementById(CurrentFocus).innerHTML = letter;//place keystroke on crossword
setCookie(CurrentFocus , letter , forever , '' , '' , ''); //CurrentFocus = cell_x_y
HighlightNextBox();//go to next box
}

//-------------------------------------


//SetCellsFromCookies();
