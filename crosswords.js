
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
var dir_across = 0;
var dir_down = 1;
var word_lengths = {}; //wordLengths[wordLength] = 1 ; so we have a list of word sizes = object.keys(wordLengths);
var words_of_length = {}; //a count of the number of words of length x : words_of_length[x]
var words_of_length_string = {}; // ,word1,word2, etc
var linear_word_search = {}; // linear_word_search[WORo] = next letter

//key orders should be [dir][yy][xx] for readability when troubleshooting !!!!!!!!!!!!!!!!!!!
var letter_positions_of_word = []; //letter_positions_of_word[dir][word_number] returns [ ofLetterPositions ];
var position_in_word = []; //position_in_word[dir][yy][xx] = position_count

var this_square_belongs_to_word_number = []; //this_square_belongs_to_word_number[dir][yy][xx]

var all_masks_on_board = []; //all_masks_on_board[dir][word_number] returns the mask of letters that have been laid down. eg: XoLoooo

var walkpath = '';

main();
function main(){

//url arg processing
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

if(! urlParams.has('wordfile')){
		alert('Please call from main form.');
		throw new Error('done');
}

var arg_grid =  urlParams.get('grid');
grid_change( arg_grid );

numberBlankSquares();

var arg_wordfile = urlParams.get('wordfile');
var arg_walkpath = urlParams.get('walkpath');
loadWordList( arg_wordfile , arg_walkpath);

var big_String = printPuzzle();
document.getElementById('puzzle_place').innerHTML = big_String;

tt = 9;

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

var x , xx;
var y , yy;
var word_length;
var word_number = 0;
var was_there_an_across_word = 0; //
var blank_word = '';
var dir;
var word_pos = [];

//label all grid squares with data
  for (y = 0 ; y < puzzle_height ; y++) {
    for (x = 0 ; x < puzzle_width ; x++) {
      was_there_an_across_word = 0; //assume not
      for (dir = 0 ; dir < 2 ; dir++) { //#for both across 0 and down 1 words
        if(puzzle[y][x] == pad_char){continue;}
        word_pos = getWordLetterPositions(x , y , dir);
        if(word_pos){
          if( (word_pos[0][0] == x) && (word_pos[0][1] == y) ){//first letter in word?
             word_length = word_pos.length;
             word_lengths[word_length] = 1; //mark globally that there is a word of this length
             if(! was_there_an_across_word ) word_number++; //allows us to not increase count if across and down share first letter pos
             was_there_an_across_word = 1;
             //set letter_positions_of_word[$numberCount][$dir] = [TempLetterPositions];
             if(typeof letter_positions_of_word[dir] === 'undefined' ){letter_positions_of_word[dir] = [];}
             letter_positions_of_word[dir][word_number] = JSON.parse(JSON.stringify(word_pos)); //deep copy multi dim array
             //set all_masks_on_board[dir][word_number] = 'ooooooooo';
             blank_word = blank_word.padEnd(word_length , unoccupied);
             if(typeof all_masks_on_board[dir] === 'undefined' ){all_masks_on_board[dir] = [];}
             all_masks_on_board[dir][word_number] = blank_word;
             //set position_in_word , this_square_belongs_to_word_number
             word_pos.forEach(function(currentValue , index){
                   //set position_in_word for all word_pos in this word
                   xx = currentValue[0];
                   yy = currentValue[1];
                   if(typeof position_in_word[dir] === 'undefined' ){position_in_word[dir] = [];}
                   if(typeof position_in_word[dir][yy] === 'undefined' ){position_in_word[dir][yy] = [];}
                   position_in_word[dir][yy][xx] = index;
                   //set this_square_belongs_to_word_number[dir][yy][xx] for all word_pos in this word
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

function loadWordList( arg_wordfile , arg_walkpath){
    var db = arg_wordfile;
    var wl = Object.keys(word_lengths);
      wl.forEach(function(word_length){
        var file_and_path = './wordlists/' + db + '/words/' + word_length + '.txt';
        var word_list_text = readStringFromFileAtPath(file_and_path);
        //still need to process
								var word_list_array = word_list_text.split(/\r?\n|\r|\n/g); //split on lines into array
								if( word_list_array[word_list_array.length-1].trim() == '' ){
										word_list_array.pop();
										}//remove last line if empty

								words_of_length[word_length] = 	word_list_array.length;
								//process word_list_array
								words_of_length_string[word_length] = ''; //start blank
								word_list_array.forEach( function(word){
										if( arg_walkpath.includes('Letter') ){//letter walk
												var mask_pre = '';
												var mask = '';
												var letters_array = word.split('');
												letters_array.forEach( function( letter , index ) {
														mask_pre += letter;
														if(index + 1 == word_length){	return; }//skip last letter
														mask = mask_pre.padEnd(word_length , unoccupied);
														if(typeof linear_word_search[mask] == 'undefined'){ linear_word_search[mask] = {}; } //create on first access
														var next_letter = letters_array[index+1];
														linear_word_search[mask][next_letter] = 1; //letter list will be accessible by object.keys()
												});
										}
										else{//word walk
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

function gup( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}

var browserType;
if (document.layers) {browserType = "nn4";}
if (document.all) {browserType = "ie";}
if (window.navigator.userAgent.toLowerCase().match("gecko")) {browserType= "gecko";}

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
