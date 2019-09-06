/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Header Search
4. Init Menu
5. Init Timer
6. Init Lightbox


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
	initLightbox();
	// initNews();


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
				// console.log(response[0].longdate);
				for (let i = 0; i < response.length; i++) {
					// console.log("FEATRUED? ", response[i].featured)
					if (response[i].featured === true) {
						dateToCountTo = moment(response[i].longdate).format("MMMM D, YYYY")
						dateToCountTo = $('#dateToCountTo').text()
						// console.log("let's count event titled", response[i].title)
						// console.log("TYPE OF: ", typeof dateToCountTo)
						// console.log("DATE: ", dateToCountTo)

						// Uncomment line below and replace date
						// console.log("EVENT DAY: ", dateToCountTo)
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

							// console.log("d: ", days)

						}, 1000);

						break
					}

				}
			})



		}
	}

	/*

	6. Init Lightbox

	*/

	function initLightbox() {
		if ($('.gallery_item').length) {
			$('.colorbox').colorbox(
				{
					rel: 'colorbox',
					photo: true,
					maxWidth: '90%'
				});
		}
	}


});