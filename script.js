$(document).ready(function() {

    // predefined constants
    game = {};
    game.disc_height = 20;
    game.distance_between_posts = $('#post1').position().left - $('#post0').position().left; // integer value
    game.post_top = $('.post').height(); // string px value

    // dynamic demo variables
    game.list_items = []; // holds html for moves list
    game.list_html = '';
    game.columns = [0, 0, 0]; // Amount of discs on each stack. Calculates distance to drop down.
    game.move_from = []; // map of moves. move_from[0] moves to move_to[0]
    game.move_to = [];
    game.disc_order = [];
    game.animate_count = 0;
    game.ordered_list = $('#moves > ol');
    game.timeout = null;
    game.started = 0;

    // dynamic game variables
    game.disc_map = [ [] , [], [] ]; // a grid that tracks where the discs are placed
    game.droppable_posts = []; // post to move from, post to move to, disc to move
    game.posts_selector = ''; // initial value, will be changed based on what disc selected

    function update_move_from_array (disc) {

        if (disc == 'Source') {
            disc = 0; // column number
        } else if (disc == 'Helper') {
            disc = 1;
        } else if (disc == 'Goal') {
            disc = 2;
        }
        game.move_from.push(disc); // 0, 1 or 2
    }

    function update_move_to_array (disc) {

        if (disc == 'Source') {
            disc = 0;
        } else if (disc == 'Helper') {
            disc = 1;
        } else if (disc == 'Goal') {
            disc = 2;
        }
        game.move_to.push(disc);
    }

    function hanoi (disc, src, hlp, goal) {

       if (disc > 0) {

            hanoi(disc - 1, src, goal, hlp);

            game.list_items.push('<li>' + (game.list_items.length + 1) + '. Move disc ' + disc + ' from ' + src + ' to ' + goal + '</li>');
            update_move_from_array(src);
            update_move_to_array(goal);
            game.disc_order.push(disc - 1); // minus 1 because our discs start at 0

            hanoi(disc - 1, hlp, src, goal);
        }
    }

    function get_distance_down (move_number) {

        var move_from = game.move_from[move_number - 1]; // will return 0, 1 or 2
        var move_to = game.move_to[move_number - 1]; // will return 0, 1 or 2

        if (move_from === 0) {
            game.columns[0] -= 1; // game.columns[x] = amount of disks on the pole
        } else if (move_from === 1) {
            game.columns[1] -= 1;
        } else if (move_from === 2) {
            game.columns[2] -= 1;
        }

        if (move_to === 0) {
            game.columns[0] += 1;
        } else if (move_to === 1) {
            game.columns[1] += 1;
        } else if (move_to === 2) {
            game.columns[2] += 1;
        }
        return (game.columns[move_to] - 1) * (game.disc_height) + 'px';
        // returns bottom: value. minus -1 because we want dest column before we updated it
    }

    function get_left_value_for_demo () {

         var current_disc = game.disc_order[game.animate_count - 1]; // will assign 0 first move
         var left_value = $('#disc' + current_disc).position().left; // integer
         var direction = (game.move_from[game.animate_count - 1] < game.move_to[game.animate_count - 1]) ? 'right' : 'left';

         if (direction == 'right') {
             var multiplier = (game.move_to[game.animate_count - 1] - game.move_from[game.animate_count - 1] == 2) ? 2 : 1;
         } else if (direction == 'left') {
             var multiplier = (game.move_to[game.animate_count - 1] + game.move_from[game.animate_count - 1] == 2) ? -2 : -1;
         }

         return left_value + (game.distance_between_posts * multiplier) + 'px';
    }

    function send_disc_down (distance_down) {

        $('#disc' + game.disc_order[game.animate_count - 1]).animate({
            bottom: distance_down
        }, 250,
        'swing',
        function() {
            if (game.animate_count < game.move_to.length) {
                send_disc_up();
            }
        });
    }

    function send_disc_across () {

        var left_value = get_left_value_for_demo();

        $('#disc' + game.disc_order[game.animate_count - 1]).animate({
            left: left_value
        }, 250,
        'swing',
        function() {

            var distance_down = get_distance_down(game.animate_count);
            send_disc_down(distance_down);
        });
    }

    function send_disc_up () {  // first animation, going up

        clearTimeout(game.timeout);
        game.animate_count += 1;

        $('#disc' + game.disc_order[game.animate_count - 1]).animate({
            bottom: game.post_top
        }, 250,
        'swing',
        function() {

            game.ordered_list.prepend(game.list_items.shift());

            send_disc_across(); // will pass 1 the first iteration
        });
    }

    function calculate_all_moves (discs) {

        game.columns[0] = discs;
        hanoi(discs, 'Source', 'Helper', 'Goal');
    }

    function check_for_data_errors() {
        if (game.distance_between_posts !== $('#post2').position().left - $('#post1').position().left) {
            alert('The posts are not an equal distance apart.');
        }
    }

    function populate_discs(discs) {

       var disc_html = '';
       var bottom = (discs * game.disc_height) - game.disc_height; // bottom value for top disc

       for (var i = 0; i < discs; i+=1) {
           disc_html += '<div class="disc" id="disc' + i + '"></div>';
       }

       $('#discs').html(disc_html);

       for (var i = 0; i < discs; i+=1) {
           $('#disc' + i).css('bottom', bottom + 'px');
           bottom = bottom - game.disc_height; // subtract disc height for next disc
       }
    }

    function reset_game_data () {

        clearTimeout(game.timeout);

            game.list_items = [];
            game.list_html = '';
            game.columns = [0, 0, 0];
            game.move_from = [];
            game.move_to = [];
            game.disc_order = [];
            game.animate_count = 0;
            game.ordered_list.html('');
            $('#discs').html('');
            game.disc_map = [ new Array(3), new Array(3), new Array(3) ]; // game related
            game.drop_down_bottom_value = 0; // game related
    }

    $('input.demo').click(function() {

        if (game.started === 0) {

            game.started = 1;

            var disc_amount = parseInt($(this).attr('id'));
            populate_discs(disc_amount);
            calculate_all_moves(disc_amount);

            game.timeout = setTimeout(send_disc_up, 300);

        } else { // reset dynamic variables

            reset_game_data();

            var disc_amount = parseInt($(this).attr('id'));
            populate_discs(disc_amount);
            calculate_all_moves(disc_amount);

            game.timeout = setTimeout(send_disc_up, 300);
        }
    });

    /*
     *
     *
     * Game-specific Functionality Below
     *
     *
     */

    function get_left_value_for_game (current_disc_num, target_post) {

        var left = $('#post' + target_post).position().left - ($('#disc' + current_disc_num).outerWidth() /2 ) + ($('#post' + target_post).outerWidth() / 2);
        return left + 'px';
    }

    function get_distance_to_drop_down (target_post) {

        var discs_on_post = 0;

        for (var i = 0; i < game.disc_map[0].length; i+=1) {

            if (!isNaN(game.disc_map[target_post][i])) {

                discs_on_post += 20;
            }
        }
        return discs_on_post;
    }

    function send_to_top_of_post (current_disc_num, target_post, source_post) {

        $('#disc' + current_disc_num).animate({
            left: get_left_value_for_game(current_disc_num, target_post),
            top: '50px'
            },
            150,
            function() {
                send_to_bottom_of_post (current_disc_num, target_post);
            }
        );
    }

    function send_to_bottom_of_post (current_disc_num, target_post, source_post) {

        $('#disc' + current_disc_num).animate({

            top: (230 - game.distance_to_drop_down) + 'px' // drop down distance set earlier
            },
            300,
            function() {

                update_grids(current_disc_num, source_post, target_post); // update game.disc_map & game.draggable_grid
                clear_draggable_grid();
                set_draggable_grid(); // reset the draggables according to current board position
                game.droppable_posts = [];
                game.posts_selector = '';
                update_draggables();
                set_draggables();
            }
        );
    }

    function set_disc_map (disc_amount) {

        for (var i = 0; i < disc_amount; i+=1) {

            game.disc_map[0][i] = i;

            if (i > 0) {
                game.disc_map[i] = new Array(disc_amount);
            }
        }
    }

    function get_source_post (disc_num) { // takes the disc number (int) of disc being dragged

        var source_post;

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (game.disc_map[i][j] === disc_num) {

                    source_post = i;

                    return source_post;
                }
            }
        }

        if (source_post === undefined) {
            alert('source post not found.');
        }
    }

    function check_if_larger_disc_below (current_disc_num) {

        var posts_with_larger_disc_on_top = [0, 0, 0];

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (!isNaN(game.disc_map[i][j])) {

                    if (game.disc_map[i][j] > current_disc_num) {

                        posts_with_larger_disc_on_top[i] = 1;
                    }
                    break; // if we found a disc_map position we're breaking, whether posts_with_larger_disc_on_top[i] assigned 1 or not
                }
            }
        }
        // alert('posts_with_larger_disc_on_top: ' + posts_with_larger_disc_on_top)
        return posts_with_larger_disc_on_top;
    }

    function check_if_post_has_no_discs () {

        var post_has_no_discs = [1, 1, 1]; // assume they all have no discs first

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (!isNaN(game.disc_map[i][j])) {

                    post_has_no_discs[i] = 0;
                    break;
                }
            }
        }
        // alert('post_has_no_discs: ' + post_has_no_discs)
        return post_has_no_discs;
    }

    function set_droppable_posts (source_post, current_disc_num) { // 1

        // alert('source post: ' + source_post)

        game.droppable_posts = []; // reset in case the disc reverted and now they clicked disc from another post
        game.posts_selector = ''; // clear previous selector

        var disc_counter = 0;

        var posts_with_larger_disc_on_top = check_if_larger_disc_below(current_disc_num);

        var post_has_no_discs = check_if_post_has_no_discs();

        for (var i = 0; i < 3; i+=1) {

            if ((i !== source_post && posts_with_larger_disc_on_top[i] === 1) || (i !== source_post && post_has_no_discs[i] === 1)){

                game.droppable_posts.push(i);
            }
        }

        for (var i = 0; i < game.droppable_posts.length; i += 1) {

            game.posts_selector += '#post' + game.droppable_posts[i]  + ',';
        }

        game.posts_selector = game.posts_selector.substring(0, game.posts_selector.length - 1); // trim off last comma
        return game.posts_selector;
    }

    function update_grids (current_disc_num, source_post, target_post) {

        var old_position_deleted = 0;
        var new_position_marked  = 0;

        // first remove old disc position from grid
        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (game.disc_map[i][j] === current_disc_num) {

                    game.disc_map[i][j] = undefined;

                    old_position_deleted = 1;
                    break;
                }
            }
            if (old_position_deleted === 1) {
                break;
            }
        }

        // make sure old position was deleted
        if (old_position_deleted !== 1) {
            alert('Old position wasnt deleted');
        }

        // next, mark the disc in its new position
        for (var i = game.disc_map[0].length - 1; i > -1; i-=1) {

            if (game.disc_map[target_post][i] === undefined) {

                game.disc_map[target_post][i] = current_disc_num;
                new_position_marked = 1;
                break;
            }
        }

        // make sure new position was marked
        if (new_position_marked !== 1) {
            alert('New position wasnt marked');
        }
    }

    function clear_draggable_grid () {

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                game.draggable_grid[i][j] = undefined;
            }
        }
    }

    function update_draggables() {

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (game.draggable_grid[i][j] === 1) {

                    $('#disc' + game.disc_map[i][j]).draggable({ disabled: false });
                } else {

                    $('#disc' + game.disc_map[i][j]).draggable({ disabled: true });
                }
            }
        }
    }

    function set_draggables () {

        for (var i = 0; i < 3; i+=1) {

            for (var j = 0; j < game.disc_map[0].length; j+=1) {

                if (!isNaN(game.disc_map[i][j]) && game.draggable_grid[i][j] === 1) {

                    $('#disc' + j).draggable({

                        containment: 'document',
                        revert: 'invalid',
                        cursor: 'pointer',

                        start: function(event, ui) {

                            var current_disc_num = parseInt($(this).attr('id').charAt($(this).attr('id').length - 1));

                            var source_post = get_source_post(current_disc_num); // get integer returned

                            var droppable_posts = set_droppable_posts(source_post, current_disc_num);

                            // alert('droppable_posts: ' + droppable_posts + ' current disc:' + current_disc_num)

                            $(droppable_posts).droppable({

                                tolerance: 'touch',

                                over: function(event, ui) {

                                    $(this).css('box-shadow', '8px 3px 10px #2B211E');
                                },
                                out: function(event, ui) {

                                    $(this).css('box-shadow', '5px 3px 10px #2B211E');
                                },
                                drop: function(event, ui) {

                                    $(this).css('box-shadow', '5px 3px 10px #2B211E');

                                    var target_post = parseInt($(this).attr('id').charAt($(this).attr('id').length - 1));

                                    game.distance_to_drop_down = get_distance_to_drop_down(target_post); // prepare animation data before grid updated

                                    $('#post0, #post1, #post2').droppable();
                                    $('#post0, #post1, #post2').droppable('destroy');

                                    send_to_top_of_post(current_disc_num, target_post, source_post);
                                }
                            });
                        }
                    });
                }
            }
        }
    }

    function set_draggable_grid () {

        for (var i = 0; i < 3; i+=1) {

            for (var j = game.disc_map[0].length - 1; j > -1; j-=1) {

                if (!isNaN(game.disc_map[i][j])) {

                    game.draggable_grid[i][j] = 1;

                    if (game.draggable_grid[i][j + 1]) { // if disc below it was draggable, make it undraggable

                        game.draggable_grid[i][j + 1] = undefined;
                    }
                }
            }
        }
    }

    $('.game').click(function() {

        $('#disc0, #disc1, #disc2').stop({ clearQueue: true, jumpToEnd: true });

        var disc_amount = parseInt($(this).attr('id'));

        set_disc_map(disc_amount);

        game.draggable_grid = [new Array(disc_amount), new Array(disc_amount), new Array(disc_amount)];

        populate_discs(disc_amount);

        set_draggable_grid();

        set_draggables();

        game.ordered_list.html('');

        console.log(game);
    });
});
