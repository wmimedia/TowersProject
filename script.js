$(document).ready(function(){
  //Predefined constants
  towers = {};
  towers.diskHeight = $('#disk1').outerHeight(); //disk height in 20 px
  towers.colPos = ['112px', '245px', '378px'];
  //*****numbers can be dynamically achieved by
  //$('#post1').position().left - $('#post0').position().left
  //and this would be beneficial for alignment. However, my div ids are not
  //set up for this and I dont care enough to refactor the code in the hopes
  //that nothing breaks. :) <3

  towers.postDistance = $('#helper').position().left - $('#source').position().left;

  //UPDATE: Nevermind.... i obviously did it. got tired of looking at the disks fall incorrectly

  //there are always 3 towers and they are in constant positioning
  towers.top=$('.post').height(); //distance to up
  //this also does not change... will also dictate how far the disks will animate to the top of the tower
  towers.orderedList=$('#moves > ol');

  //Predefined Variables
  towers.listItems=[]; //array of list moves for animation
  towers.listHtml='';
  towers.columns= [0,0,0];
  //this will keep track of the amount of disks on each stack. will also be used to calculate the distance to drop animation
  towers.moveFrom=[];
  towers.moveTo=[];
  towers.diskOrder= [];
  //these three variable arrays will always be the same length
  //
  towers.animateCount = 0;
  towers.timeout = null;
  towers.started = 0;

  towers.disc_map = [ [] , [], [] ];
  towers.droppable_posts = [];
  towers.posts_selector = '';

  function moveFromArray (disk)
  {
    if (disk == 'source')
    {
      disk = 0; //defines column number of the current moving disk
    }
    else if (disk == 'helper')
    {
      disk = 1;
    }
    else if (disk == "goal")
    {
      disk = 2;
    }
    towers.moveFrom.push(disk);//0,1, or 2
  }

  function moveToArray(disk)
  {
    if (disk == "source")
    {
      disk = 0;
    }
    else if (disk == 'helper')
    {
      disk = 1;
    }
    else if (disk == 'goal')
    {
      disk = 2;
    }
    towers.moveTo.push(disk);
  }

  function hanoi(disk, src, hlp, goal)
  {
    if (disk > 0)
    {
      hanoi(disk - 1, src, goal, hlp);

      towers.listItems.push('<li> Move disk '+ disk + ' from ' + src + ' to ' + goal+ '</li>');
      moveFromArray(src);
      moveToArray(goal);
      towers.diskOrder.push(disk - 1);

      hanoi(disk - 1, hlp, src, goal);

      //calling this recursive function the parameters
      //are passed in a dynamic order for a reason
    }
  }
  //Recursive function that uses all necessary data to output a series of moves that will result
  //in the least possible steps to solving the hanoi function/puzzle thingamajigger
  function getDistanceDown (moveNum)
  {
    var move_from = towers.moveFrom[moveNum - 1]; //will return 0, 1, or 2
    var move_to = towers.moveTo[moveNum - 1]; //same as above
    // console.log(move_from);
    // console.log(move_to);
    // console.log(moveNum);
    // moveNum+=1;
    if (move_from === 0)
    {
      towers.columns[0] -= 1; //towers.columns[x] is the amount of disks on pole
    }
    else if (move_from === 1)
    {
      towers.columns[1] -= 1;
    }
    else if (move_from === 2)
    {
      towers.columns[2] -= 1;
    }

    if (move_to === 0)
    {
      towers.columns[0] += 1;
    }
    else if (move_to === 1)
    {
      towers.columns[1] += 1;
    }
    else if (move_to === 2)
    {
     towers.columns[2] += 1;
    }

    // console.log(move_to); //should return 2 on first iteration
    // console.log(towers.columns[0]);
    // console.log(towers.columns[2]); //should return 1 on first iteration
    // console.log(towers.columns[move_to]);
    // console.log(((towers.columns[move_to] - 1) * (towers.diskHeight)) + 'px');

    return ((towers.columns[move_to] - 1) * (towers.diskHeight)) + 'px';
    //will return the bottom : value minus 1 and finds destination column before move to destination is called
  }
  function itsGoingDown(distanceDown)
  {
    $('#disk' + towers.diskOrder[towers.animateCount - 1]).animate(
    {
      bottom: distanceDown
    }, 500, 'swing',//animation type and speed
    function()
    {
      if(towers.animateCount < towers.moveTo.length)
      {
        goingUp();
      }//anonymus function call will produce the animation call for everything
    });
  }
  function getLeftVal()
  {
    var currentDisk = towers.diskOrder[towers.animateCount-1]; //will assign 0 the first iteration
    var leftValue = $('#disk' + currentDisk).position().left; //dynamically takes the CSS left value of current disk being moved

    var direction = (towers.moveFrom[towers.animateCount - 1] < towers.moveTo[towers.animateCount-1]) ? 'right' : 'left';

    if(direction === 'right')
    {
      var multiplier = (towers.moveTo[towers.animateCount - 1] - towers.moveFrom[towers.animateCount - 1] == 2) ? 2 : 1;
    }
    //are we going two posts over to the right or one
    else if (direction === 'left')
    {
      var multiplier = (towers.moveTo[towers.animateCount - 1] + towers.moveFrom[towers.animateCount - 1] == 2) ? -2 : -1;
    }
    //are we going two posts to the left or one
    return leftValue + (towers.postDistance * multiplier) + 'px';
  }
  function across ()
  {
    //here we are passing in towers.move_to[x]
    //because we have now gathered all the necessary information
    var leftValue = getLeftVal();//towers.colPos[towers.moveTo[towers.animateCount - 1]];//zero first time
    // destination post given by moveTo
    $('#disk' + towers.diskOrder[towers.animateCount - 1]).animate({
      left: leftValue
    }, 500, 'swing',
    function()
    {
      var distanceDown = getDistanceDown(towers.animateCount);
      itsGoingDown(distanceDown);
    });
  }
  function goingUp() //first animation or the ascent
  {
    towers.animateCount += 1;

    $('#disk' + towers.diskOrder[towers.animateCount - 1]).animate
    ({
      bottom: towers.top //animation of disk going up
    }, 500, 'swing',
    function ()
    {
      //callback function
      towers.listHtml += towers.listItems.shift();
      //shifts pushed list items from one array listItems to another (listHtml)
      //allows for record of movements
      towers.orderedList.html('');
      //clears ordered list
      towers.orderedList.append(towers.listHtml);
      //appends the listHtml back to the oredered list of moves
      across();
      //passes 1 on the first iteration
    });
  }
  function calculateMoves (disks)
  {
    towers.columns[0] = disks;
    // How many disks can sit on a tower? 3
    //used to calculate the ampount of distance needed to drop down
    //based on the height of the disks and their position relative
    //to the bottom of the container that they are in.
    hanoi(disks, 'source', 'helper', 'goal');
    //passes in 4 things... the number of disks and the three towers
  }
  calculateMoves(3);
  setTimeout(goingUp, 1500);
  //running a recursive function and animating after calculation
  //created 1.5 second timeout for fluidity

  console.log(window.towers);
});
