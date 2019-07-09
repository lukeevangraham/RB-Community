$(document).ready(function () {
	// eventContainer holds all of our posts
	var eventContainer = $(".event-container");
	// Click events for the edit and delete buttons
	// $(document).on("click", "button.delete", handlePostDelete);
	// $(document).on("click", "button.edit", handlePostEdit);
	var events;

	function getEvents() {
		// $.get("api/events", function (data) {
		// 	console.log("Events", data);
		// 	events = data;
		// 	if (!events || !events.length) {
		// 		displayEmpty();
		// 	}
		// 	else {
		// 		initializeRows();
		// 	}
		// });
	}

	// This function displays a message when there are no posts
	function displayEmpty() {
		eventContainer.empty();
		var messageH2 = $("<h2>");
		messageH2.css({ "text-align": "center", "margin-top": "50px" });
		messageH2.html("No posts yet for this category, navigate <a href='/cms'>here</a> in order to create a new post.");
		eventContainer.append(messageH2);
	}

	// Getting the initial list of posts
	getEvents();
	// InitializeRows handles appending all of our constructed post HTML inside
	// blogContainer
	function initializeRows() {
		eventContainer.empty();
		var eventsToAdd = [];
		for (var i = 0; i < events.length; i++) {
			eventsToAdd.push(createNewRow(events[i]));
		}
		eventContainer.append(eventsToAdd);
	}

	// This function constructs an event's HTML
	function createNewRow(event) {
		var newEventCard = $("<div>");
		newEventCard.addClass("events_item");
		var newEventImg = $("<div>");
		newEventImg.addClass("events_item_image");
		newEventImg.append('<img src="images/event_2.jpg" alt="" />')
		var newEventInnerDiv = $("<div>");
		newEventInnerDiv.addClass("events_item_content d-flex flex-row align-items-start justfy-content-start");
		var newEventDateDiv = $("<div>");
		newEventDateDiv.addClass("event_date");
		var newEventDateDivClass = $("<div>");
		newEventDateDivClass.addClass("d-flex flex-column align-items-center justify-content-center");
		var newEventDayDiv = $("<div>");
		newEventDayDiv.addClass("event_day");
		var newEventMonthDiv = $("<div>");
		newEventMonthDiv.addClass("event_month");



		var newPostCardHeading = $("<div>");
		newPostCardHeading.addClass("card-header");
		var deleteBtn = $("<button>");
		deleteBtn.text("x");
		deleteBtn.addClass("delete btn btn-danger");
		var editBtn = $("<button>");
		editBtn.text("EDIT");
		editBtn.addClass("edit btn btn-default");
		var newPostTitle = $("<h2>");
		var newPostDate = $("<small>");
		var newPostCategory = $("<h5>");
		newPostCategory.text(event.title);
		newPostCategory.css({
		  float: "right",
		  "font-weight": "700",
		  "margin-top":
		  "-15px"
		});
		var newPostCardBody = $("<div>");
		newPostCardBody.addClass("card-body");
		var newPostBody = $("<p>");
		newPostTitle.text(event.title + " ");
		newPostBody.text(event.title);
		var formattedDate = new Date(event.createdAt);
		formattedDate = moment(formattedDate).format("MMMM Do YYYY, h:mm:ss a");
		newPostDate.text(formattedDate);
		newPostTitle.append(newPostDate);
		newPostCardHeading.append(deleteBtn);
		newPostCardHeading.append(editBtn);
		newPostCardHeading.append(newPostTitle);
		newPostCardHeading.append(newPostCategory);
		newPostCardBody.append(newPostBody);
		newEventCard.append(newPostCardHeading);
		newEventCard.append(newPostCardBody);
		newEventCard.data("post", event);
		return newEventCard;
	  }

})












/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Header Search
4. Init Menu
5. Init Timer


******************************/

$(document).ready(function () {
	"use strict";

	/* 

	1. Vars and Inits

	*/

	var header = $('.header');
	var hamb = $('.hamburger');
	var menuActive = false;
	var menu = $('.menu');

	setHeader();

	$(window).on('resize', function () {
		setHeader();
	});

	$(document).on('scroll', function () {
		setHeader();
	});

	initHeaderSearch();
	initMenu();
	initTimer();

	/* 

	2. Set Header

	*/

	function setHeader() {
		if ($(window).scrollTop() > 100) {
			header.addClass('scrolled');
		}
		else {
			header.removeClass('scrolled');
		}
	}

	/* 

	3. Init Header Search

	*/

	function initHeaderSearch() {
		if ($('.search_button').length) {
			$('.search_button').on('click', function () {
				if ($('.header_search_container').length) {
					$('.header_search_container').toggleClass('active');
				}
			});
		}
	}

	/* 

	4. Init Menu

	*/

	function initMenu() {
		if (hamb.length) {
			if (menu.length) {
				hamb.on('click', function () {
					if (menuActive) {
						closeMenu();
					}
					else {
						openMenu();
					}
				});

				$('.menu_close').on('click', function () {
					if (menuActive) {
						closeMenu();
					}
					else {
						openMenu();
					}
				});
			}
		}
	}

	function closeMenu() {
		menu.removeClass('active');
		menuActive = false;
	}

	function openMenu() {
		menu.addClass('active');
		menuActive = true;
	}

	/* 

	5. Init Timer

	*/

	function initTimer() {
		if ($('.event_timer').length) {

			let dateToCountTo

			$.ajax({
				url: "/api/events/",
				method: "GET"
			}).then(function (response) {
				console.log(response[0].longdate);
				for (let i = 0; i < response.length; i++) {
					console.log("FEATRUED? ", response[i].featured)
					if (response[i].featured === true) {
						dateToCountTo = moment(response[i].longdate).format("MMMM D, YYYY")
						console.log("let's count event titled", response[i].title)
						
						// Uncomment line below and replace date
			console.log("EVENT DAY: ", dateToCountTo)
			var target_date = new Date(dateToCountTo).getTime();

			// comment lines below
			// var date = new Date();
			// date.setDate(date.getDate() + 3);
			// var target_date = date.getTime();
			//----------------------------------------

			// variables for time units
			var days, hours, minutes, seconds;

			var d = $('#day');
			var h = $('#hour');
			var m = $('#minute');
			var s = $('#second');

			setInterval(function () {
				// find the amount of "seconds" between now and target
				var current_date = new Date().getTime();
				var seconds_left = (target_date - current_date) / 1000;

				// do some time calculations
				days = parseInt(seconds_left / 86400);
				seconds_left = seconds_left % 86400;

				hours = parseInt(seconds_left / 3600);
				seconds_left = seconds_left % 3600;

				minutes = parseInt(seconds_left / 60);
				seconds = parseInt(seconds_left % 60);

				// display result
				d.text(days);
				h.text(hours);
				m.text(minutes);
				s.text(seconds);

			}, 1000);

			break
					}

				}
			})


			
		}
	}

});