
var pad_char = 'x';
var unoccupied = 'o';
//var grid_string = '';
//var word_list_strings;

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

var walkpath = '';
var mode = ''; //letter or word

var next_letter_position_on_board = [];
// all letter position on board used for cycling through letter placements, etc
// [{x => $x, y => $y} , , ]
// next_letter_position_on_board[]{x} NextWordPositionsOnBoard[]{y}

var next_word_on_board = []; //next_word_on_board = [ [word_number , dir] , [] , ... ]
//all words position on board used for cycling through word placements, etc
// [{wordNumber => $wordNumber, dir => $dir},{},{}...]
//$nextWordOnBoard[]{wordNumber} $nextWordOnBoard[]{dir}

//optimal search variables
var wordNumberDirUsed; //$wordNumberDirUsed{$wordNumber}{$dir} so we only backtrack or note words that have been filled
var naive_backtrack = 0; //a counter
var optimal_backtrack = 0; //a counter
//var touchingWordsForBackTrack; //global as we need to backtrack to the first  member of it we encounter. if not == () we are in a backtrack state!
var target_cells_for_letter_backtrack = {}; //global as we need to backtrack to the first  member of it we encounter. if $targetLettersForBackTrack{x failed letter}{y failed letter} == undef there are NO targets!
//target_cells_for_letter_backtrack[x_y][xx_yy] = 1; //x_y is this cell and target _cells are stored in keys xx_yy!
var target_words_for_word_backtrack = {}; //global as we need to backtrack to the first  member of it we encounter. if $target_words_for_word_backtrack{# source}{dir source} == undef there are NO targets!
//eg $target_words_for_word_backtrack{$wordNumberSource}{$dirSource}{$crossingWordNumber}{$crossingWordDir}
var words_that_are_inserted = {};

var forward_count = 0;
var naive_count = 0;

main();
var arg_shuffle;
var arg_optimalbacktrack;
function main() {

	//url arg processing
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	arg_shuffle = urlParams.get('shuffle');

	if (!urlParams.has('wordfile')) {
		alert('Please call from main form.');
		throw new Error('done');
	}

	var arg_grid = urlParams.get('grid');
	grid_change(arg_grid);

	numberBlankSquares();

	var arg_wordfile = urlParams.get('wordfile');
	var arg_walkpath = urlParams.get('walkpath');
	if (arg_walkpath.includes('Letter')) {
		mode = 'letter';
	} else {
		mode = 'word';
	}
	loadWordList(arg_wordfile, arg_walkpath);

	//word walks
	if (arg_walkpath == 'crossingwords') {
		generateNextWordPositionsOnBoardCrossing();
	}

	//letter walks
	if (arg_walkpath == 'GenerateNextLetterPositionsOnBoardZigZag') {
		generateNextLetterPositionOnBoardZigzag();
	}
	if (arg_walkpath == 'GenerateNextLetterPositionsOnBoardFlat') {
		generateNextLetterPositionOnBoardFlat();
	}

	// is simplewordmasksearch=on
	var arg_simplewordmasksearch = urlParams.get('simplewordmasksearch');

	arg_optimalbacktrack = urlParams.get('optimalbacktrack');
	if (arg_optimalbacktrack) {
		calculateOptimalBacktracks();
	}

	if (mode == 'word') {
		if (recursiveWords() == 0) { //failed
			temp = 7;
		}
	} else {
		setInterval(printProcessing, 1000);
		//printProcessing();
		if (recursiveLetters() == 0) { //failed
			temp = 6;
		}
	}

printProcessing();

	var puzzle_string = printPuzzle();
	document.getElementById('puzzle_place').innerHTML = puzzle_string;
}

function printProcessing() {
//my $message = $_[0];
var x , y;
var line;
var string = '<pre>';
var time;
//$time =  time - $timeForCrossword;

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

for (var wordNumber = 1 ; wordNumber < 300 ; wordNumber++){
      for (var dir = 0 ; dir < 2 ; dir++){
            var word = all_masks_on_board[dir][wordNumber];
            //#if (undef ne $word)
            if (typeof word !== 'undefined'){
                 //string += "$wordNumber $dir: $word \n"
                 }
            }
      }

string +=  "\n";
//string += "Time: " . $time; #print time to create crossword
string += "\n";
//string += "Loops: " . $recursiveCount; #print time to create crossword
string += "\n";
//string += "Sec per Loop: " . (time - $timeForCrossword) / $recursiveCount; #print time to create crossword
string += "\n";
//string +=  "Loops per Sec: " . $recursiveCount / (time + 1 - $timeForCrossword); #print time to create crossword
string += "\n\n";
//string += "optimalBacktrack:$optimalBacktrack naiveBacktrack:$naiveBacktrack recursive calls:$recursiveCount\n";

string += "</pre>";
/*
if ($message ne "") {
     if ($string =~ /^!/)
          {$string = "$message\n\n$string";}
     else
         {$string = "$message";}
     }
*/

document.getElementById('workspace').innerHTML = string;
//seek($processing, 0 , 0); #need to keep file open to lock it!
//print $processing "$string";
}

var letter_backtrack_source; //set to () to stop backtrack and set for backtrack $letterBackTrackSource{x} and  $letterBackTrackSource{y}
function recursiveLetters() {
	//recursive try to lay down letters using @nextLetterPositionsOnBoard, this function will shift off, store and unshift if required
	//store locally the possible letters in  @possibleLetter
	//the next index in the list (@nextLetterPositionsOnBoard) is the next letter position we are trying to fill

	//recurse if we can't find possible letters (going forward) or run out of possible letters
	//next / loop if we can't lay a letter (word already used) and we have more possible letters to pick from
	//anytime we next / loop set to $unoccupied as we are processing (just in case)
	//anytime we recurse back (can't lay a letter or run out) a square we must unshift @nextLetterPositionsOnBoard , {x => $x, y => $y}; and return 0
	//if our recursive calls have returned from a failed letter, set $unoccupied (to try another letter) and next / loop to see if there are anymore possible letters for this square

	//note optimal recursion will not work if upper letter is part of a horizontal word
	//the reason is that we may be backtracking due to a later letter in the upper horizontal word.
	//If we wipe that word out without trying ALL the combinations in that upper word we may be missing possible words in the horizontal word we are working on now
	//an exception is if it is the last letter of a horizontal word
	//so: only optimal up if:
	//1. the upper target letter it is not part of a horizontal word
	//2. the upper target letter is the last letter in a horizontal word
	//3. the letter that failed is in a single vertical word
	var x , y , x_y , xx_yy;
	var cell_position;
	var letters_that_fit = [];
	var popped_letter;
	var success = 0;//assume we failed to get in while loop
	var words_that_were_laid = [];

	//moving forward
	letter_backtrack_source = undefined; //clear global indicating that we are moving forward and have cleared the backtrack state
	if (next_letter_position_on_board.length == 0) {return 1;} //we have filled all the possible letter positions, we are done. This breaks us out of all recursive  success loops
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
			next_letter_position_on_board.unshift([x, y]); //always unshift our current position back on to next_letter_position_on_board before backtracking
			if (arg_optimalbacktrack) { //optimal backtrack setup
				if (typeof letter_backtrack_source === 'undefined') { //only set for optimal if we are not already in an optimal backtrack mode
					x_y = '' + x + '_' + y;
					if (typeof target_cells_for_letter_backtrack[x_y] !== 'undefined') { //check to see if there are any backtrack targets possible for $x $y first
						letter_backtrack_source = [x , y]; //set source/start cell for optimal bactracking
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
		//after a failed (or the puzzle is completed), we will be here
		if (success == true) {return true;} //test to see if board was filled, this is where we return out of all recursive calls successfully. it was triggered a few lines above.

		//------------------------------------------------------------

		//success == false , so we have been backtracking to...
		//if we are here, the last recursive attempt to lay a letter failed
		words_that_are_inserted[words_that_were_laid[0]] = undefined; //if a word was laid before, reverse that
		words_that_are_inserted[words_that_were_laid[1]] = undefined;
		setXY(x, y, unoccupied); //failed so reset letter to unoccupied
		//exclusively optimal backtrack check and processing
		if (typeof letter_backtrack_source !== 'undefined') { //we are doing an optimal backtrack
			xx_yy = '' + letter_backtrack_source[0] + '_' + letter_backtrack_source[1];
			x_y = '' + x + '_' + y;
			if (target_cells_for_letter_backtrack[xx_yy][x_y]) { //we have hit the first optimal backtrack target.
				letter_backtrack_source = undefined; //turn off optimal backtrack
			} else {//we did not find optimal backtrack target yet
				next_letter_position_on_board.unshift([x, y]); //always unshift our current position back on to @nextLetterPositionsOnBoard when we return!
				optimal_backtrack++;
				return false; //go back one to see if it is optimal backtrack target
			}
		}
	} //end while
	document.alert('Error: Recursive, we should never get here.');
}

function setXY(x, y, letter) {
	//only used for fill letter routines. not fill word routines
	//see if potential mask equates to a word already laid. if true return false
	//set cell, horiz mask , vert mask
	//return : true if mask laid , false if mask or word already used , [full words laid]

	var word_number; // = this_square_belongs_to_word_number;
	var position;
	var mask = [];
	var dir;
	var words_laid; //leave undefined and any define if we need to push a mask to return

	//get masks, see if unique mask (equating to a word) or full word is already laid, if so return false
	for (dir = 0; dir < 2; dir++) {
		if (typeof this_square_belongs_to_word_number[dir][y][x] === 'undefined') {
			continue;
		} //no word here
		word_number = this_square_belongs_to_word_number[dir][y][x];
		position = position_in_word[dir][y][x];
		mask[dir] = all_masks_on_board[dir][word_number];
		//add letter to mask
		mask[dir] = mask[dir].substring(0, position) + letter + mask[dir].substring(position + 1);
		if (letter != unoccupied) { //no need if unoccupied
			if (isWordAlreadyUsed(mask[dir])) { //any word already used return false
				return false;
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
		if (!mask[dir].includes(unoccupied)) { //if mask full word add to words_laid and also to $wordsThatAreInserted
			words_that_are_inserted[mask[dir]] = 1;
			if (typeof words_laid === 'undefined') {
				words_laid = [];
			}
			words_laid.push(mask[dir]);
		}

	}

	if (typeof words_laid !== 'undefined') {
		return words_laid;
	}
	return true;
}

function isWordAlreadyUsed(mask) {
//input of mask WORooooo
//check to see if all possible letters 'o' have only one possible letter. If so, only one word can be created. See if this word has been used.
//saves us from filling in a whole word on letter fills only to have to backtrack
var next_letters;
//let pattern = /${unoccupied}/g;
let pattern =  new RegExp(`${unoccupied}`, 'g');
while ( pattern.test(mask) ) { //see if we get single letters until end of word
        next_letters = Object.keys(linear_word_search[ mask ]);
		//&getNextPossibleLetters($mask);
        if (next_letters.length > 1){ //multiple words possible for mask.
            return 0;
            }
        //$temp = $nextLetters[0];
		mask.replace( unoccupied , next_letters[0]); //replace first blank with the single letter
        //$mask =~ s/o/ next_letters[0]/; //replace first blank with the single letter
        }
//only one word is possible for mask at this point
//but has it been used?
if (typeof words_that_are_inserted[mask] !== 'undefined') { return 1; }
else {return 0;}
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
		possible_letters_HV[dir] = Object.keys(linear_word_search[mask[dir]]);
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
	var walk_cells_up_to_xy = [];
	var word_letter_positions;
	var cell_position;

	var word_position;
	var word_number;
	var dir;
	var walk_words_up_to_current_word = [];
	var word_positions;
	var next_letter_position_on_board_temp = JSON.parse(JSON.stringify(next_letter_position_on_board)); //backup as we are going to tear it up
	var next_word_on_board_temp = JSON.parse(JSON.stringify(next_word_on_board)); //backup as we are going to tear it up

	if (mode == "letter") {
		while (next_letter_position_on_board_temp.length != 0) {
			cell_position = next_letter_position_on_board_temp.shift(); //remove next letter position
			x = cell_position[0];
			y = cell_position[1];

			for (dir = 0; dir < 2; dir++) {
				if (typeof walk_cells_up_to_xy === 'undefined') {
					continue;
				} //code will not work if walk_cells_up_to_xy is empty
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
					let val = JSON.stringify(word_position);
					if (walk_cells_up_to_xy.includes(val)) { //add to target_cells_for_letter_backtrack
						if (typeof target_cells_for_letter_backtrack[x_y] === 'undefined') {
							target_cells_for_letter_backtrack[x_y] = {};
						}
						target_cells_for_letter_backtrack[x_y][xx_yy] = true; //x_y is this cell and target _cells are stored in keys xx_yy!
					}
				});
			}
			walk_cells_up_to_xy.push(JSON.stringify(cell_position));
		}
	}

	//for now ignore differences from simple word search and crossing word search
	//we will just backtrack to crossing words
	//after testing we may expand the crossing word backtrack
	if (mode == 'word') {
		while (next_word_on_board_temp.length != 0) {
			word_position = next_word_on_board_temp.shift(); //keep in subroutine unchaged as we may need to unshift on a recursive return
			word_number = word_position[0];
			dir = word_position[1];
			//let tsbtwn = this_square_belongs_to_word_number[dir][y][x];
			word_letter_positions = letter_positions_of_word[dir][word_number];
			//what words are crossing this word?
			word_positions = getCrossingWords(word_number, dir);
			word_positions.forEach(function(word_position) {
				word_number_temp = word_position[0];
				dir_temp = word_position[1];
				var w_d = '' + word_number + '_' + dir;
				var w_d_temp = '' + word_number_temp + '_' + dir_temp;
				if (w_d == w_d_temp) {
					return;
				} //skip current word as it should not be a backtrack destination
				let val = JSON.stringify(word_position);
				if (walk_words_up_to_current_word.includes(val)) { //add to target_words_for_word_backtrack
					if (typeof target_words_for_word_backtrack[w_d] === 'undefined') {
						target_words_for_word_backtrack[w_d] = {};
					}
					target_words_for_word_backtrack[w_d][w_d_temp] = 1;
				}
			});
			walk_words_up_to_current_word.push(JSON.stringify(word_position)); //put it on @upToCurrentWord
		}
	}
}

function generateNextWordPositionsOnBoardCrossing(){
		//start with 1 horiz.
		//find all crossing words
	//find all their crossing words.
		//only add # and direction once!
		//FIFO

		//get my @WordLetterPositions = @{$letterPositionsOfWord[$wordNumber][$dir]}
		//used to find crossing words fast with @ThisSquareBelongsToWordNumber
		var already_in_list = {}; // already_in_list[number][direction] = 1 if already in list
		already_in_list[dir_across] = {};
		already_in_list[dir_down] = {};
		var word_number = 1;
		var dir = 0;

		if (typeof all_masks_on_board[dir][word_number] === 'undefined' ) {$dir = 1;}// no horizontal #1 word. go vertical
		var to_do_list = []; //list of words and directions to process. ((1,0) , (2,0) , .... ) shift off and push on so we do in an orderly fasion!
		to_do_list.push( [word_number , dir] );
		//if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
		already_in_list[dir][word_number] = 1;
		next_word_on_board.push( [word_number , dir] );
		while ( to_do_list.length > 0 ){
				[word_number , dir] = to_do_list.shift();
					var crossing_words = getCrossingWords( word_number , dir );
					while ( crossing_words.length > 0 ){
							[word_number , dir] =crossing_words.shift();
							//if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
							if (typeof already_in_list[dir][word_number] !== 'undefined'){
												continue;
							}//already added. skip
							to_do_list.push( [word_number , dir] );
							next_word_on_board.push( [word_number , dir] );
							if(typeof already_in_list[dir] === 'undefined'){already_in_list[dir] = {};}
							already_in_list[dir][word_number] = 1;
					}
		}
}

function getCrossingWords(word_number, dir) {
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
			crossing_words.push([crossing_word_number, crossing_word_dir]);
		}
	});
	return crossing_words;
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

//grid_change( document.getElementById("grid").value );
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
  lines.forEach( getLetters ); //process lines array

  //square_grid(); //make the grid a square filling with pad_char on the right
  puzzle.forEach( function(currentValue){
    var arr_length = currentValue.length;
    if(puzzle_width > arr_length) {
     currentValue.length = puzzle_width;
     currentValue.fill(pad_char , arr_length);
    }
  });

}

function getLetters(currentValue , index) {
 var line = currentValue.trim(); //remove whitespace
 if( line.length > puzzle_width ) {
  puzzle_width = line.length;
  }//keep seeing if we have a larger line width
 var letters = line.split(''); //split line into letters array
 //var t = letters.valueOf();
 letters.forEach( addToPuzzle , index ); //process letters array : index is passed to the function as its this value
 }

function addToPuzzle(currentValue , index) {
 var x = index;// index of letters array
 var y = this.valueOf(); //!! this is the index from/used in getLetters  !!

 if (typeof puzzle[y] === 'undefined') { puzzle[y] = []; }//add second dimension
 puzzle[y][x] = currentValue;
}

function numberBlankSquares(){
 //gridToGlobalVars()
 //this does a lot of var setup
 //and also associate all squares with words and word # , get word lengths on grid ,
//thisSquareBelongsToWordNumber[$xx][$yy][$dir]
//positionInWord[$xx][$yy][$dir] = $PositionCount;
//letterPositionsOfWord[$numberCount][$dir] = [TempLetterPositions];
//all_masks_on_board[$numberCount][$dir] = $blankWord;

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
             if(! was_there_an_across_word ) word_number++; //allows us to not increase count if across and down share first letter pos
             was_there_an_across_word = 1;
             //set letter_positions_of_word[$numberCount][$dir] = [TempLetterPositions];
             if(typeof letter_positions_of_word[dir] === 'undefined' ){letter_positions_of_word[dir] = [];}
             letter_positions_of_word[dir][word_number] = JSON.parse(JSON.stringify(word_letter_positions_array)); //deep copy multi dim array
             //set all_masks_on_board[dir][word_number] = 'ooooooooo';
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
  var dx,dy;
  var xx = x , yy = y;
  var letter_pos = [];
  [dx,dy] = getDxDy(dir);
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

function getDxDy(dir){
  var dx , dy;
  if(dir == dir_across){
    dx = 1;
    dy = 0;
  }
  if(dir == dir_down){
    dx = 0;
    dy = 1;
  }
return [dx,dy];
}

function loadWordList(arg_wordfile, arg_walkpath) {
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
			if (mode == 'letter') { //letter walk
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
			} else { //word walk
				words_of_length_string[word_length] = words_of_length_string[word_length] + ',' + word.toUpperCase();
			}

		});
	});
	word_list_text = ''; //cleanup
}
function printPuzzle(){
  var temp , temp3 , temp4;
  var x , y , dir;
  var temp_puzzle = [];
  var word;
  var direction;
		var word_count = 0;
  var pre_text = '';
  var post_text = '';

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
                  //temp3 += "direction: $clues{$word} \n";
                  //temp3 =~ s/[\'\"]//g; //remove quotes from title s it is in a tag
                }
            }

          temp4 = ""; //clear the soon to be choose() routine variable
          //var word_count = 0;
          if (typeof this_square_belongs_to_word_number[dir_across][y][x] !== 'undefined') {word_count++;} //horiz word here
          if (typeof this_square_belongs_to_word_number[dir_down][y][x] !== 'undefined') {word_count++;} //vert word here

          //if (word_count == 2){
											//pre_text = 'if (horiz_vert == 0) {';
											//post_text='};';
											//}
          //new
										for (dir = 0 ; dir < 2 ; dir++){
											/*	if (typeof this_square_belongs_to_word_number[dir][y][x] !== 'undefined'){
                word_number = this_square_belongs_to_word_number[dir][y][x];
                word = all_masks_on_board[dir][word_number];
                temp4 += `${pre_text}choose("${word}" , ${x} , ${y} , ${ letter_positions_of_word[dir_across][word_number] } ); ${post_text}`;
												}*/
												if (word_count == 2){
														pre_text = `if (horiz_vert == ${dir}) {`;
														post_text='};';
														}
												if (typeof this_square_belongs_to_word_number[dir][y][x] !== 'undefined'){
                word_number = this_square_belongs_to_word_number[dir][y][x];
                 word = all_masks_on_board[dir][word_number];
																var letter_positions_of_word_json =  JSON.stringify( letter_positions_of_word[dir][word_number] );
                temp4 += `${pre_text}choose("${word}" , ${x} , ${y} , ${letter_positions_of_word_json}); ${post_text}`;
												}
										}
          temp4 += "ToggleHV();";

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
                <TD title='${temp3}' CLASS='tdwhiteclass' ID='cell_${x}_${y}'
                ONCLICK='${temp4}' VALIGN='middle' WIDTH='20' ALIGN='center'
                HEIGHT='25'>&nbsp;</TD>
                </TR>
              </TBODY>
            </TABLE>
            </TD> `;
          }

          //unoccupied square, but not a pad_char
          if( (typeof temp_puzzle[y][x] === 'string') && (temp_puzzle[y][x] != pad_char) ){
            temp += ` <td title='${temp3}' ID='cell_${x}_${y}' CLASS='tdwhiteclass' ONCLICK='${temp4}'>&nbsp;</td> `;
            }
        }
    temp += "</tr>\n";
    }
temp += "</table>\n";
return temp;
}


/*
sub LoadWordList {
my $filename = $_[0];
my $line;
my $word;
my $clue;
my $wordLength;
my $mask;
my $lineCount;
my $t = time();
my %wordsOfLength;
my $wordCount;

my $directory = "./wordlists/$in{wordfile}/words/";
#read word and clue file
if (not -d $directory) {die "directory $directory does not exist"};

#new routine just loads word files of requested word lengths
#work files were separated earlier
foreach $wordLength ( keys %wordLengths)
         {
         $message = $message . "Loading words of length $wordLength...\n";
         &PrintProcessing($message);

         $filename = "$directory$wordLength\.txt";
         #$filename = "$directory/all.txt";
         open (DATA, "<$filename") or &Quit( "Word file $filename does not exist" );
         print '.'; #help keep alive on big loads

         foreach $word (<DATA>)
                  {
                  $word =~ s/\n//g; #remove line return
                  $word =~ s/\r//g; #remove line return
                  if ($word eq '') {next} #blank line. toss
                  $lineCount++;
                  $word = uc($word); #all words must be uppercase for standard, display and search reasons.
                  $wordsOfLength{$wordLength}++; #global var for statistics

                  #build $wordsOfLengthString[$wordLength] string
                  if ($wordsOfLengthString[$wordLength] eq '') {$wordsOfLengthString[$wordLength] = ','} #start string of words with a coma
                  $wordsOfLengthString[$wordLength] = "$wordsOfLengthString[$wordLength]$word,"; #build a comma delimited string of each possible word length

                  #letter by letter build here
                  my @lettersInWord =  split('' , $word);
                  my $letterPosition = 0;
                  #prep for new fast linear word search : $linearWordSearch{mask}
                  $mask = $word;
                  $mask =~ s/\S/o/g; #build a mask with ooooooooo of wordlength
                  foreach my $letter (@lettersInWord)
                           {
                           #build new fast linear word search : $linearWordSearch{mask}
                           $linearWordSearch{$mask}{ substr($word,$letterPosition,1) } = 1 ; #add letter for $letterPosition to set of hash keys for this $mask
                           substr ( $mask , $letterPosition , 1 , $letter); #change mask with next letter added to it Cooo to COoo
                           $letterPosition++;
                           }
                  }
         close (DATA);
         }

#done loading words. Let's calculate some statistics
foreach my $length (sort keys %wordsOfLength)
     {
     if ($debug ) {print "$length : $wordsOfLength{$length}\n";}
     $wordCount = $wordCount + $wordsOfLength{$length};
     }

my $tt = time() - $t;
if ($debug ) {print "$lineCount lines and $wordCount words loaded in $tt sec \n\n";}
}
*/

//--------------------------------------



var forever = new Date('October 17, 2030 03:24:00'); //use in cookies
//var isAClickableClass['tdwordselectedclass'] = 1;
//isAClickableClass['tdwhiteclass'] = 1;
var isAClickableClass = {tdwordselectedclass:1 , tdwhiteclass:1 , tdselectedclass:1};

function SetCellsFromCookies()
{
	var theCookies = document.cookie.split(';');
    var aString = '';
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

function doSaveAs(){
		if (browserType != "ie") {alert("Not IE. You must right click and select 'Save page as...'");}
		if (document.execCommand) {document.execCommand("SaveAs");}
}


var startx ; //based on word #1 across or down
var starty ;
if(typeof letter_positions_of_word[dir_across][1]){
	starty = letter_positions_of_word[dir_across][1][0][0][0];
	startx = letter_positions_of_word[dir_across][1][0][0][1];
}
else{
	starty = letter_positions_of_word[dir_down][1][0][0][0];
	startx = letter_positions_of_word[dir_down][1][0][0][1];
}

var LetterPosArray = new Array(startx,starty);
var OldLetterPosArray = new Array(startx,starty);
var horiz_vert = 0; //0 is  horiz 1 is vert
var OldClue = '';
var CurrentFocus = ''; //ID Name  where letters will be inserted
var CurrentClass = 'tdwhiteclass'; //for remembering the class to return the square too
var NthPosition = 0; //so we can find the next square to type a letter into
var CurrentPos = new Array(startx,starty); //CURRENTLY HIGLIGHTED BOX COORDINATES

function ToggleHV()
{
if (horiz_vert == 0) {horiz_vert=1;}
else {horiz_vert=0;}
}

function ClearBox(cell)
{
if (CurrentFocus != "") {document.getElementById(CurrentFocus).className = CurrentClass;} //restore the class name to white
}

function HighlightBox(cell)
{
CurrentClass = document.getElementById(cell).className; //store the class name of the square in the process of being focused
document.getElementById(cell).className = 'tdselectedclass'; //select/focus the square
CurrentFocus = document.getElementById(cell).getAttribute('ID');
}

function HighlightNextBox()
{
var xpos = CurrentPos[0];
var ypos = CurrentPos[1];
var cell = "cell_" + xpos + "_" + ypos;

ClearBox(cell);
NthPosition = NthPosition + 2;
if (NthPosition >= LetterPosArray.length) {NthPosition = 0;}
xpos = LetterPosArray[NthPosition];
ypos = LetterPosArray[NthPosition+1];
cell = "cell_" + xpos + "_" + ypos;
HighlightBox(cell);
}

function HighlightClue(theword)
{
if (OldClue != "")
        {document.getElementById(OldClue).className = 'cluesCleared';} //clear old clue
document.getElementById(theword).className = 'cluesSelected'; //select/focus the clue
OldClue = theword;
}

function HighlightWord(LetterPosArrayArg)
{
	var t;
//white out old word
for (i = 0; i < OldLetterPosArray.length; i = i + 2)
        {
        t = "cell_" + OldLetterPosArray[i] + "_" + OldLetterPosArray[i+1];
        document.getElementById(t).className = 'tdwhiteclass';
        }
//set current word to old word so we can white it out later
OldLetterPosArray = LetterPosArrayArg.slice();
//highlight the current word
for (i = 0; i < LetterPosArrayArg.length; i = i + 2)
        {
        t = "cell_" + LetterPosArrayArg[i] + "_" + LetterPosArrayArg[i+1];
        document.getElementById(t).className = 'tdwordselectedclass';
        }
}

function FindNthPosition(xpos,ypos,LetterPosArrayArg)
{
for (i = 0; i < LetterPosArrayArg.length; i = i + 2)
        {
        if ( (xpos == LetterPosArrayArg[i]) && (ypos == LetterPosArrayArg[i+1]) ) {return(i);}
        }
}

function choose(word , xpos , ypos , LetterPosArrayArg)
{
CurrentPos = [xpos,ypos];
//CurrentPos = [LetterPosArrayArg[0],LetterPosArrayArg[1]];
var cell = "cell_" + xpos + "_" + ypos; //generate text class ID for the chosen square
ClearBox(cell);//clear old box
LetterPosArray = LetterPosArrayArg.slice();
HighlightClue(word);
HighlightWord(LetterPosArray);
HighlightBox(cell);
NthPosition = FindNthPosition(xpos,ypos,LetterPosArray);
}

//---------------------------------------

	function send_cell_update(k)
	{
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
	 cell = "cell_" + xpos + "_" + ypos;
	 if (isAClickableClass[document.getElementById(cell).className] == 1) {
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

function CreateBookmarkLink()
	{
	var title = "Crossword game %game%";
	var url = "%archiveurl%/%uid%/%game%";
	if (window.sidebar)
 		{ // Mozilla Firefox Bookmark
		window.sidebar.addPanel(title, url,"");
		}
	else if( window.external )
		{ // IE Favorite
		window.external.AddFavorite( url, title);
		}
	else if(window.opera && window.print)
		{ // Opera Hotlist
		return true;
		}
 	}


		//-------------------------------------


hide2('Answers');
//SetCellsFromCookies();
