/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Header Search
4. Init Menu


******************************/

$(document).ready(function () {
  "use strict";

  /* 

	1. Vars and Inits

	*/

  var header = $(".header");
  var hamb = $(".hamburger");
  var menuActive = false;
  var menu = $(".menu");

  setHeader();

  $(window).on("resize", function () {
    setHeader();
  });

  $(document).on("scroll", function () {
    setHeader();
  });

  initHeaderSearch();
  initMenu();

  prepEmail();

  /* 

	2. Set Header

	*/

  function setHeader() {
    if ($(window).scrollTop() > 100) {
      header.addClass("scrolled");
    } else {
      header.removeClass("scrolled");
    }
  }

  /* 

	3. Init Header Search

	*/

  function initHeaderSearch() {
    if ($(".search_button").length) {
      $(".search_button").on("click", function () {
        document.querySelector(".search_input").focus();
        if ($(".header_search_container").length) {
          $(".header_search_container").toggleClass("active");
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
        hamb.on("click", function () {
          if (menuActive) {
            closeMenu();
          } else {
            openMenu();
          }
        });

        $(".menu_close").on("click", function () {
          if (menuActive) {
            closeMenu();
          } else {
            openMenu();
          }
        });
      }
    }
  }

  function closeMenu() {
    menu.removeClass("active");
    menuActive = false;
  }

  function openMenu() {
    menu.addClass("active");
    menuActive = true;
  }

  function prepEmail() {
    // let $element = $.colorbox.element()
    // var element = $(".emailStaff").colorbox.element();
    // console.log("HERE: ", element);

    console.log("setting up!");

    $(".emailStaff").on("click", function (e) {
      $.colorbox({
        html: `
        	<form action="/api/email" method="POST" class="row m-0">
    		<input type="text" name="recipient" value="${e.target.value}" class="d-none" />
    		<div class="col-lg-6">
    			<input class="form_input w-100" type="text" name="name" placeholder="Your Name" />
    		</div>
    		<div class="col-lg-6">
    			<input class="w-100" type="email" name="email" placeholder="Your Email Address" />
    		</div>
    		<div class="col-lg-12 mt-3">
    			<textarea class="w-100" rows=7 name="message" placeholder="Your Message" />
    		</div>
    		<div class="col-lg-12 mt-3">
    			<button>Send</button>
    		</div>
    	</form>
        `,
      });
    });

    // $(".emailStaff").colorbox({
    //   html: `
    // 	<form action="/api/email" method="POST" class="row m-0">
    // 		<input name="recipient" value="Luke" class="d-none" />
    // 		<div class="col-lg-6">
    // 			<input class="form_input w-100" type="text" name="name" placeholder="Your Name" />
    // 		</div>
    // 		<div class="col-lg-6">
    // 			<input class="w-100" type="email" name="email" placeholder="Your Email Address" />
    // 		</div>
    // 		<div class="col-lg-12 mt-3">
    // 			<textarea class="w-100" rows=7 name="message" placeholder="Your Message" />
    // 		</div>
    // 		<div class="col-lg-12 mt-3">
    // 			<button>Send</button>
    // 		</div>
    // 	</form>
    // `,
    // });
  }
});
