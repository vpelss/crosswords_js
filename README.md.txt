Emogic's Crossword Generation Algorithm

Note, my Javascripte version is the most up to date. While porting my PERL code to JS, I have found many logical errors in my algotithms. I have tried to fix them, and I believe my JS version to be the prefered version. Time permitting I may update my PERL code with the fixes.

Both versions are intended more as a tool to study and test a few algorithms that can generate crossword puzzles and the differences between them.
It is not intended to generate New York Times quality puzzles. 

See: "Design and Implementation of Crossword Compilation Programs Using Serial Approaches" (CCP). It was at http://thesis.cambon.dk/. But that site no longer exists. The author has granted permission for me to post it on my github. See "thesis.cambon.dk.pdf". I have used many of the concepts mentioned in his thesis and in some cases expanded on them. If you want to create your own crossword generator script,it is a great place to start. The thisis has sample code in C. 

It has been suggested that a letter by letter search is as good (or equivalent) to a word by word search. In a logical sense it is, but not in a practical sense. Yes a letter search can mimic a word search. But letter searches take longer to discover dead ends in the search space, compared to full word searches. So unless your letter search is minicing a word search, there will likely be many more CPU cycles burned on a letter search.
Update: I have noticed that the letter by letter search is very fast in JS and in many cases out performs the word searches. On PERL this is noth the case. I belive this is due to PERL having higly optimized regexp code. My word serches rely on the regexp code as it provides amazing memory savings and makes the code much simpler. To make the word search routine as fast as a letter search routine, I would need more RAM than a standard PC has.

The Code

My Crossword Source Code is at:
PERL: https://github.com/vpelss/crosswords
JS: https://github.com/vpelss/crosswords_js

You can download the code for my old British style Crossword Generator at: https://www.emogic.com/store/free_crossword_script. 
It is very simplistic.

My code is commented. However, I make no apologies if it makes no sense to you. 

Why the PERL version?

PERL is not known for it's speed. It also has a higher memory overhead for variable management. But it does have a few benefits. Regular expressions are powerful and fast. Hash variables (associative array) allow for an easy way to eliminate duplicate values and make it easy to search and look-up values.

PERL is ubiquitous. PERL is elegant. PERL is, in my opinion, organic. I just like PERL

What, a Javascript Version Too?

Why a Script version? Well it is ubiquitous also. 

I also wanted to compare the speed with my Perl version.

Converting my Perl code to JS also gave me a chance to revisit my code to see if it could be improved or modified.

JS associative arrays are not as easy to use and flexible as the Perl hash (for JS nested arrays you need to manually create each nest level) . So unless I had to use an associative array I convered most of the data structures to arrays. 

Note that the JS version downloads the database from my site, the files are not stored locally.

Word Lists

The word lists are not included. A wonderful one was at  www.otsys.com/clue (now: https://tiwwdty.com/clue/).
There was a plain text database there in the past, but it is no longer provided. 
You could petition the author, Matt Ginsburg, if he is still a member at:
https://www.cruciverb.com/
Cruciverb is a great source for infomation also. The community is very freindly.

Some things I have learned

1. The bigger the word database the better.

2. Single letter searches are not the answer (for some grids) as there are too many combinations. For each lay of a letter you only check at most two words with the letter in common. So even with the fast calculation time for each letter, all the recursion adds up. Complete word searches (Laying a word and simultaneously checking that all the crossing words will have a possible word) although much slower, has fewer recursive calls. On most of my test scenarios, laying words was faster. Another way of stating the benefit of laying words is that a single random word replacement searches the puzzle space quicker. For example, when laying the first letter, if that letter will never result in a valid puzzle, we may not know until millions of recursions have passed. We discover mistakes faster by laying whole words.

3. Each time you lay a word, you must ensure that all it's crossing word positions will be able to fit a word. If not, you will preform too many recursions. The code is more complex, but it is worth it.

4. Your path algorithm for laying words (the order in which you lay words) should ensure that each following word in your path crosses the previous one. This helps reduce wasted recursions. A case of an inefficient recursion path would be trying to lay all across words, then checking if the down words are valid.

5. Optimal backtracks (see CCP) help a lot (x100 speed increases or more in some cases).

6. Recursively designed routines, although not required, seem more logical and suited for this sort of program.

7. The puzzle space is immense. The puzzle solution space is minuscule. Therefore simple recursive and random attempts are unlikely to work in a timely manner on their own. We need to prune the search space using choice forward paths optimal backtracks.

Crossword Puzzle Grid Template Design (empty)

I chose a simple text design.

The grid templates are text files containing rows made up of 'o' and 'x'.
'x' = black squares
'o' = empty squares
The x and o were chosen as they are the same size and this gives an easily visual representation of the actual grid in notepad.

In the script they are retained as such, and do not conflict, as the inserted letters will always be capital letters.
The main puzzle array will be in the form of $puzzle[x][y]->{Letter} = T

eg:
xooooo
ooooxo
ooooxo

Searches

There are many types of searches we can perform to try and determine what word or letter will fit on our crossword.

Letter Searches

Prefix / Linear Searches : Return the next potential letters after a given series of letters
Note: This  is for a letter by letter search.

Given the prefix letters for a word, return the next possible letters.
eg: given 'boa--' found in the space for a 5 letter word, the next letter might be t or r.
This is useful only if you plan to build words from beginning to end. It will not allow for filling in random letter positions (eg: it cant solve for TO?TH)

Method 1. For each word length I built a chain of hash references. This required that, for a search, our code had to follow the chain of hash references. It was more complex but it was fast. 
$nextLetter[numberOfLettersInWord] would point to a list of hashes where the keys were possible first letters. So a "keys %nextLetter[5]" would return all the first letters of possible 5 letter words. If we chose the letter 'b', and referenced $nextLetter[5]{b} we would get a list of hash references to all the potential 2nd letters of 5 letter words that start with 'b'. etc...

*Method 2. Then I decided that it was simpler to implement and almost as fast to just use masks using prefixes. That would eliminate the need to supply the word length (as the mask is the right length). And no code to navigate a  chain of hashes was necessary.
$linearWordSearch{CAo} returned ( ${'T'} , ${'R'} , ${'B'} , ${'N'} )
I did not return a list of letters. I return a list of keys, which were the letters. This simplified the list creation ensuring there are no duplicate letters
@letters = keys %{$linearWordSearch{$mask}};
Note: the mask must be a prefix mask only. ie: HIGoooooo
It is 1.5 times slower than the old way.
Memory storage is about the same.

Word Searches

Mask Searches : @words = &WordsFromMask($mask) $mask = ‘GOoD’ :  Return a list of potential words for a given mask

Method 1. For a given mask (eg GOoD), cycle through all the letters given. For each letter given, return a list (built before) of all words, the same length as the mask, that have that letter in that position. Do that for all all letters that we have in the mask. Then we compare all the lists and keep the words that exist in all the lists. 
It was complex, and was not very fast as we had to repeatedly compare potentially large lists of words.
It's memory use was average to high as a  word string was stored multiple times, at least as many times as letters in the word. Eg: DOG was stored 3 times, once for each letter.

*Method 2. Words of Length String. For each word length we have created a precompiled, large comma delimited string consisting of all the words of that length. We use regular expressions to search that string for the mask and return the list of words.
The memory storage is as efficient as one could hope for. eg DOG is only stored once in the comma delimited words of 3 letter string.
The speed is surprisingly fast for searching long strings.
PERL rocks!

my $tempMask = $mask;
$tempMask =~ s/$unoccupied/\./g; #make a mask of 'GO$unoccupiedT' into 'GO.T' for the regexp (in my code $unoccupied is = o)
my $wordLength = length($tempMask);
@word_list = ($WordsOfLengthString[$wordLength] =~ /($tempMask),/g);

Method 3. Binary Mask. For each word we build every possible mask. Then for each mask we create a list of words that belong to that mask.
Eg: CAT -> CAT , CAo , CoT , Coo , oAT , etc
In theory it should be very fast. But it is only slightly faster than the Words of Length String word search in some cases. 
Copying or accessing the list takes the majority of the time and therefore is not much faster for cases where the list returned will be large. Small returned lists are faster as the Method 2 still needs to search the complete comma delimited string. 
So smaller returned word lists will show a speed improvement with this method.
However, this method uses large amounts of memory as longer words cause exponential memory growth.
It also takes a long time to build the database as we need to create many (grows exponentially as the word is longer) binary masks (and associated word lists) for every word in the dictionary. 

Possible words from letter lists Search (meta search) : choosing words that fit based on the crossing words.

This routine that takes a list of possible letters (based on all the crossing word masks) for each position in a word and will output a list of words that can be made with said letters.
@words = &WordsFromLetterLists(['C','D','F','T','Z'] , ['E','R','T','Y','O'] , ['T','R','E','W','Q','Z']);
Eg: We want to find possible words at 5 down. We find all the masks that cross this word. We find all the possible letters that can exist in our word's cells. Then we calculate what words we can make with these sets of letters.

It takes a lot of processing time. We must first search for possible letters in our word based on all the crossing words. Then we must search all the combinations of those letter sets for words in our dictionary.

----o---
----o---
----o---

It can take up to 250 times longer than a simple mask word search ), and 833 times slower than the letter search on some grids. However, it is faster on many types of grids as it looks at blocks of letters, not just crossing words. Therefore it notices errors sooner (less recursions) and avoids a lot of inefficient blind recursions that can occur with the other search methods. 

Note: It really shines if your walking/search path ensures that each following word crosses the previous one(s).

Optimum Backtrack for Word by Word Builds

By adding an optimum backtrack routine, I have improved the generation time by a factor of 2500 times or more in "some" cases. 

If a word attempt fails, I make a list of the crossing word positions (and all??? their crossing words) (and the adjacent words positions???) (above, below or left / right). Those are the words that influence the word positions that failed. 

This is similar with a letter search. All cells in both the horizontal word, and vertical word, of the cell,  can affect the ability to place a letter in that cell. 

I backtrack until I hit one of the word positions (or letter positions) in that list. 
You must stop on the first one encountered or you risk losing possible puzzle solutions.

Grids that do not seem to benefit are the Double Word Grids with 100% interlock. This makes sense as all or most crossing words affect the word you are trying to solve for.

eg:
Letter Search - letter by letter routine : 0.00006 sec per call. But most recursions
Word Search Mask: 0.0002 sec per call. Many recursions.
Word Search Meta : 0.05 sec per call. Less recursions.
Word Search Meta with optimum backtrack: 0.09 sec per call. Potenially fewest recursions.

Letter search: ? can affect placements of letter at o

-----x------
-----?------
--x?o??x
-----?------
-----x------

Word Search: crossing words ? can affect placement of word ooo

-----x------
x??ox-----
--x?o??x--
----xo???x--
-----xx------



Data Structures

%WordListBy_WordLength_Letter_LetterPosition
No longer used: I use @WordsOfLengthString, masks and regex
set $WordListBy_WordLength_Letter_LetterPosition[$wordLength][ord($letter)][$LetterPosition]{$Word} = 1
@words = keys %{$WordListBy_WordLength_Letter_LetterPosition[$wordLength][ord($Letter)][$LetterPosition]}
a hash, instead of a list, is used so we don't have duplicate words

%linearWordSearch 
No longer used: letter by letter
very fast for finding the next possible letters in a word
$linearWordSearch{mask}{key1 , key2} and it will return a list of keys (so there are no duplicates) representing the next possible letters.
@letters = keys %{$linearWordSearch{$mask}};
mask must be a prefix mask ie: TOOLooooo

@WordsOfLengthString
$WordsOfLengthString[$wordLength] = "$WordsOfLengthString[$wordLength]$Word,"; #build a comma delimited string of each possible word length
@WordsFromLetters = split (',' , $WordsOfLengthString[$wordLength]);
$tempMask = $mask;
$tempMask =~ s/$unoccupied/\./g; #make a mask of 'GO$unoccupiedT' into 'GO.T' for the regexp
$wordLength = length($tempMask);
@word_list = ($WordsOfLengthString[$wordLength] =~ /($tempMask),/g);

Our puzzle data structures use both word storage structures and letter storage structures.
Both are used at same time as both can be beneficial in different situations.

@puzzle : letter centric
the puzzle with the words inserted. array[][] returns a hash as we may want to store more data than just the cell letter in the future.  
$puzzle[$x][$y]->{Letter}

@allMasksOnBoard – word centric
all words on board whether complete or not 
$allMasksOnBoard[word number][dir 0=across 1=down] many will be undef
1 is the first word number

@LetterPositionsOfWord and @ThisSquareBelongsTowordNumber map word numbers to cell positions and vice versa.

@LetterPositionsOfWord
$LetterPositions[word #][dir] an array of all the word letter positions [[x,y],[x,y]....]
$LetterPositions[$numberCount][$Dir] = [@TempLetterPositions]; #an anonymous array reference of $x,$y pairs of all letters in the word
@WordLetterPositions = @{$LetterPositions[$wordNumber][$Dir]}
Can be used to find all crossing words fast with @ThisSquareBelongsTowordNumber and using the other $dir

@ThisSquareBelongsToWordNumber
$ThisSquareBelongsToWordNumber[x][y][dir] returns the word number this square belongs too
It can be used to find the crossing word number
$wordNumber = $ThisSquareBelongsToWordNumber[$x][$y][$dir]
$crossingwordNumber = $ThisSquareBelongsToWordNumber[$x][$y][not $dir]

@PositionInWord
$PositionInWord[x][y][dir] returns the pos of letter in the word this square belongs to starting at 0
$NthLetterPosition = $PositionInWord[$x][$y][$dir]

@NextWordPositionsOnBoard
all words position on board used for cycling through word placements, etc
 [{wordNumber => $wordNumber, Dir => $Dir},{},{}...]
$wordNumber = $NextWordPositionsOnBoard[index]{wordNumber} 
$dir = $NextWordPositionsOnBoard[index]{Dir}
recommend push and pop when using recursive routines

@nextLetterPositionsOnBoard
Not used: letter by letter search
all letter position on board used for cycling through letter placements, etc
[{x => $x, y => $y} , , ]
$x = $nextLetterPositionsOnBoard[index]{x} 
$y = $NextWordPositionsOnBoard[index]{y}
recommend push and pop when using recursive routines

%wordsThatAreInserted
$wordsThatAreInserted{word} = 1 or undef
helps prevent duplicates on the board

%wordListByMask
@words = keys $WordListByMask{oYo} 
created by taking each word, then creating a binary mask for the word and
$WordListByMask{ooRo}{WORD}=1
$WordListByMask{WoRo}{WORD}=1 etc
exponentially huge database but very fast search for words fitting a mask or pattern

%mostFrequentLetters
Not used: letter by letter search
used as @{ $mostFrequentLetters{$wordLength}{$letterPos} }
contains an ordered list of the possible letters at {$wordLength}{$letterPos} and ordered from less frequent to most frequent

@letterFrequency = (E,T,A,O,I,N,S,R,H,D,L,U,C,M,F,Y,W,G,P,B,V,K,X,Q,J,Z)
Not used: letter by letter search
a list of the most common letters first to last

%backTo{x->X , y->Y}
Not used: letter by letter search
global target used for optimal backtracking.
$backTo{x} and $backTo{y}

%wordlengths
Used to identify word lengths possible on the grid so we only load words we need.
This saves time and memory.
$wordLength{6} = 1. 

$padChar 
= 'x'

$unoccupied
 = 'o'

%clues
$clue = $clues{$word}

Word Lists example sizes

Length of word 	XW Express	Extra		Clues

2		27		30		85
3		640		788		4461
4		2273		2743		11652
5 		3468		5045		20235
6		4465		6546		24496
7		4905		7129		28296
8		4730		6636		27650
9		4130		5366		24553
10		2681		3572		24344
11		1677		2221		19815
12		823		1061		13266
13		412		614		12613
15		135		185		9597
16		0		1		2697
17		0		0		1940
18 		0		0		1018
19		0		0		930
20		0		0		3041
total		30405		42034		251578
lines		30418		53899		4325826


Walk paths for Word by Word

See "thesis.cambon.dk.pdf" for the walk paths.

Flat: Horizontal words. It seems to be the fastest in a fully connected square.

Diagonal: Slow.

Switchback: Alternating horizontal and vertical word and word parts along diagonal axis. Almost as fast as flat, but no benefits.

Crossing Words: I generated my own walk that is usually faster than the other recursive word search algorithms.  I start with the very first word in the top right (although any start position could be used). Then I add all the crossing words of this starting word. Then I find and add all the crossing words to those words, etc. I only add a word once. This tends to backtrack very efficiently even with naive backtracking. 

Walks for Letter by Letter

My letter walks are always building both the horizontal and vertical words from the first letter to the last letter. 

Optimum Backtrack : for letter by letter builds

Optimal backtrack can be dependent on the walk we have chosen and the grid structures and pads around the failed letter.

I have attempted to generalize all the different optimal backtrack rules into one set of  rules that seem to work with most walks and grids. I believe that there are no illegal prunings of viable puzzle layouts.

Rule:

Master:

All horiz and vert letters can be optimum backtrack targets if they are imediately to the left and immediately above the failing cell. They obviously contribute immediately and directly to the failing cell.

On the backtrack, stop at the first optimum backtrack target that still has possible letters to lay. Important: If we stop at optimal backtrack targets that do not have letters to lay, then our script would treat it as a failed cell and start another optimal backtrack (which attempts to skip naive backtrack cells) possibly pruning viable puzzle layouts.

On our optimal backtrack, if we hit a cell, that is not an optimal backtrack target AND it is both to the left AND above the failed cell, then we must revert to the naive backtrack mode.
We can ONLY optimum backtrack over cells that are to the right and below the failed cell. If we bactrack over cells to the left and above the failed cells, these cells contribute to the possible letters in the optimum backtrack targets. Ignoring them may prune valid puzzle layouts.


---------------------------------

1. All letters in the horizontal and vertical words (up to the failed letter) can effect the failure of laying a letter, so mark it as an optimal backtrack target.


2. On the reverse walk, if we hit an optimum target and there are no possible letters left, go to next optimum found in reverse walk.

3. Remove 'shadows' by only keeping the intersection set results of rule 1 and 2
??? shadows?? WTF was I thinking????????

Note that # 2 can seem non intuitive. But I assure you they can. If we backtracked from the center letter (see below) and we are out of letters to lay at the 2nd row 1st column, we cannot go directly to C and try another letter. If we do, we miss words like CAR that might allow another solution in the second row that would be missed. 

Rule 3 also breaks certain grid backtracks, most notably British style crosswords. The reason is that since we are double spaced, there many shadows (rule 3) that should not be shadows. So I feel if we leave rule 3 out, the extra optimum back tracks we might miss are worth it to keep our optimum target rules simple. 

Currently, there are some cases where a walk and grid combination will break. Scenarios where the naive backtrack never hits a back track target causes these failures. eg: Letter ZigZag and 13x13_56_144

CAT
ooo
ooo

So there is no optimal backtrack in a square crossword with no black squares as per rule 1 and 2 as all squares are optimal backtrack squares.

So I am using a hash %targetLettersForBackTrack{x}{y} that will equal 1 if for all squares that follow rule 1 and 2 for a square where we cannot lay a letter or have run out of letters to try. So my optimized backtrack backtracks until it hits any of the squares in %targetLettersForBackTrack{x}{y}.

Dictionary and Clues

For huge word lists (required for big grids) a combined dictionary and clue database list is huge. 

A single database of all words and clues is very large and takes too much time to load and organize the data logically.

If we want our crossword algorithm to have quick access it must be loaded into RAM. But there are very few systems with that much RAM.

I settled on creating text files based on word lengths. 3.txt contains all 3 letter words in the dictionary. 7.txt contains all the 7 letter words.

After the crossword grid is loaded, only the required text files are loaded into a PERL array $wordsOfLengthString[$wordLength]. All the words in that array are comma delimited. Since PERL regular expression searches are amazingly fast, we can quickly search for word patterns to get the words we need to fit.

Once the words are all placed in the puzzle and we need the clues for those words. A quick way to load clues would to have a word.txt file for each word containing all the possible clues. 

jude.txt would contain:
Name in a Beatles song
Law of "Sleuth"
New Testament book
Saintly Thaddaeus
.....

This would quickly fill up all the available disk space as 250,000+ small text files take up much more disk space than the data they contain.

To save disk space I create clue text files based on the words first two letters no matter what the word size.
This takes 250,000 files and converts them into 650 files. It takes a little longer to load the clues, but it is not noticeable.

_ae.txt contains:

AEA|Thespians' org.
AEA|Thespians' org.
AEA|Thespians gp.
AEACUS|Grandfather of Achilles
AEAEA|Circe's island
...

Benchmarks

Based on the section on Double Word Squares at: http://en.wikipedia.org/wiki/Word_square
I feel my program is running well. The article states that 8 x 8 is around the largest order Double Word Square to be found using dictionary words. Considering my limited dictionary, my program can create frequently generate a 6 x 6 crossword in around 3 seconds.


Ideas/Questions

How can we create an efficient walk generator and optimal backtrack for any puzzle grid?

Could we place the backtrack and walk tasks in their own sub routines and still use recursion? Assuming we can find suitable data structures, maybe the overhead will slow it down?

Are dynamic walks (where the next walk location is chosen based on the current puzzle/grid fill) possible without missing valid puzzle combinations?

Can we further increase generation time by choosing more suitable or likely words first? 

I need to write a better clue selection routine to allow for different styles.
http://en.wikipedia.org/wiki/Word_square
