import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var active = false;
var mouseX = null;
var mouseY = null;

Template.game.onCreated(function() {
	var deck = [
		{ id: "1", name: "Scrub", cost: "1", attack: "2", health: "1"},
		{ id: "2", name: "Scrub", cost: "1", attack: "2", health: "1"},
		{ id: "3", name: "Wild Pyro", cost: "2", attack: "3", health: "2"},
		{ id: "4", name: "Relaxed Pyro", cost: "2", attack: "2", health: "3"},
		{ id: "5", name: "Ruthless Owl", cost: "3", attack: "4", health: "3"},
		{ id: "6", name: "Wise Owl", cost: "3", attack: "3", health: "4"},
		{ id: "7", name: "Windchill Yeti", cost: "4", attack: "5", health: "4"},
		{ id: "8", name: "Chillwind Yeti", cost: "4", attack: "4", health: "5"},
		{ id: "9", name: "Friendly Ogre", cost: "5", attack: "5", health: "6"},
		{ id: "10", name: "Angry Ogre", cost: "5", attack: "6", health: "5"}
	];
	
	// Initialize the hand
	Session.set('hand', []);
	Session.set('deck', shuffle(deck));
	Session.set('player_health', 30);
	
	Session.set('opp_hand', []);
	Session.set('opp_deck', shuffle(deck));
	Session.set('opp_health', 30);
	
	draw(); draw(); draw(); draw();
	opp_draw(); opp_draw(); opp_draw(); opp_draw();
});

Template.game.helpers({
	deck: function() {
		return Session.get('deck');
	},
	hand: function() {
		return Session.get('hand');
	},
	opp_hand: function() {
		return Session.get('opp_hand');
	},
	player_health: function() {
		return Session.get('player_health');
	},
	opp_health: function() {
		return Session.get('opp_health');
	}
});

Template.game.events({
	// Track mouse movement
	'mousemove'(event, instance) {
		mouseX = event.pageX;
		mouseY = event.pageY;
	},
	// Pick up card from hand
	'click #hand .card'(event, instance) {
		if (active === false) {
			// If no active card, pick up the card
			active = $(event.currentTarget);
			
			// Prepare the element
			active.css('position', 'fixed');

			// Make all cards clickthrough
			$('.card').css('pointer-events', 'none');

			$('#hand-area').addClass('elevated');

			// Follow the mouse
			var loop = setInterval(function(){
				if (active) {
					var cardX = mouseX - 37.5;
					var cardY = mouseY - 40;

					active.css('left', cardX + "px");
					active.css('top', cardY + "px");						
				}
			}, 30);
		}
	},
	// Play a minion
	'click #player-zone'(event, instance) {
		// if there is an active card
		if (active !== false) {
			var current_mana = get_current_mana();
			var cost = active.find('.card-cost').text();
			
			if (cost <= current_mana) {
				reduce_current_mana(cost);

				// Restore the card element to normal
				active.attr("style", "");
				active.addClass('in-play');
				active.appendTo('#player-zone');

				// Return hand area to below
				$('#hand-area').removeClass('elevated');

				// Undo the hover
				$('#player-zone').removeClass('colored');

				// Restore the cards to normal
				$('.card').css('pointer-events', 'auto');

				// Disconnect the hand event
				active.off('click');

				// Unset the card from active
				active = false;
			}
		}
	},
	// Attack
	'click #player-zone .card'(event, instance) {
		if (active === false) {
			var attacker = $(event.currentTarget);
			attacker.addClass('spent');

			var amount = attacker.find('.card-attack').text();
			reduce_health(amount);
		}
	},
	// Put a card back
	'click #hand-area'(event, instance) {
		cancel();
	},
	// Player zone hover state
	'mouseover #player-zone'(event, instance) {
		if (active !== false) {
			$('#player-zone').addClass('colored');

			$('#player-zone').mouseout(function() {
				$(this).removeClass('colored');
			});
		}
	},
	// Hand hover state
	'mouseover #hand-area'(event, instance) {
		if (active !== false) {			
			$('#hand').addClass('colored');

			$('#hand-area').mouseout(function() {
				$('#hand').removeClass('colored');
			});
		}
	},
	// End turn
	'click #end-turn-button'(event, instance) {
		startTurn();
	},
/*
	'contextmenu'(event, instance) {
		event.preventDefault();
		cancel();
	}
*/
});

// Functions
function draw() {
	var deck = Session.get('deck');
	var hand = Session.get('hand');

	if (deck.length !== 0) {
		var drawn = deck.shift();
		hand.push(drawn);

		Session.set('deck', deck);
		Session.set('hand', hand);
	}
}

function opp_draw() {
	var deck = Session.get('opp_deck');
	var hand = Session.get('opp_hand');

	if (deck.length !== 0) {
		var drawn = deck.shift();
		hand.push(drawn);

		Session.set('opp_deck', deck);
		Session.set('opp_hand', hand);
	}	
}

function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function cancel() {
	// if there is an active card
	if (active !== false) {
		// Restore the card element to normal
		active.css('position', 'relative').css('top', 'auto').css('left', 'auto');

		// Return hand area to below
		$('#hand-area').removeClass('elevated');

		// Undo the hover
		$('#hand').removeClass('colored');

		// Restore the cards to normal
		$('.card').css('pointer-events', 'auto');

		// Unset the card from active
		active = false;
	}
}

function startTurn() {
	$('#player-zone .card').removeClass('spent');
	
	var current_max = $('#player-mana-bar .mana-numbers-max').text();
	var current_max = parseInt(current_max);
	
	if (current_max < 10) {
		var new_max = current_max + 1;
	}
	
	for (var i = 1; i <= new_max; i++) {
		$('#player-mana-bar #mana-crystal-' + i).addClass('active');
		$('#player-mana-bar #mana-crystal-' + i).addClass('filled');
	}
	
	$('#player-mana-bar .mana-numbers-filled').text(new_max);
	$('#player-mana-bar .mana-numbers-max').text(new_max);
	
	draw();
}

function get_current_mana() {
	var mana = $('#player-mana-bar .mana-numbers-filled').text();
	mana = parseInt(mana);
	
	return mana;
}

function reduce_current_mana(amount) {
	// Text Box
	var current_mana = get_current_mana();
	var new_mana = current_mana - amount;
	$('#player-mana-bar .mana-numbers-filled').text(new_mana);
	
	// Circles
	for (var i = current_mana; i > new_mana; i--) {
		$('#player-mana-bar #mana-crystal-' + i).removeClass('filled');
	}
}

function reduce_health(amount) {
	var opp_health = Session.get('opp_health');
	var new_health = opp_health - amount;
	Session.set('opp_health', new_health);
}

function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}