require("dotenv").config();
let keys = require("../keys.js");
var request = require("request");
var moment = require("moment");
var path = require("path");
var marked = require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
  sanitize: true,
  smartLists: true,
  smartypants: true
});

// Import the model (event.js) to use its database functions
var db = require("../models/");

var contentful = require("contentful");

let spaceId = process.env.SPACE_ID;
let contentfulAccessToken = process.env.ACCESS_TOKEN;

const HtmlRenderer = require("@contentful/rich-text-html-renderer");
let { documentToHtmlString } = HtmlRenderer;

let vimeoPass = process.env.VIMEO_TOKEN;

var client = contentful.createClient({
  space: spaceId,
  accessToken: contentfulAccessToken
});

var vimeoOptions = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "6",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};
var vimeoOptionsHome = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "3",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};

function doReq(url, what) {
  return new Promise(function(resolve, reject) {
    request(
      {
        url: url,
        headers: {
          Bearer: "sampleapitoken"
        }
      },
      function(error, response) {
        if (error || response.statusCode !== 200) {
          reject(error);
        } else {
          var data = {};
          (Array.isArray(what) ? what : [what]).forEach(function(item, index) {
            data[item] = JSON.parse(arguments[index + 2]);
          });
          resolve(data);
        }
      }
    );
  });
}

// Routes
module.exports = function(app) {
  app.get("/blog", function(req, res) {
    client
      .getEntries({
        content_type: "blog",
        order: "-fields.datePosted"
      })
      .then(function(dbBlog) {
        var items = dbBlog.items;

        // Converting times for template
        items.forEach(item => {
          Object.assign(item.fields, {
            formattedDate: moment(item.fields.datePosted)
              .format("DD MMM, YYYY")
              .toUpperCase()
          });

          var truncatedString = JSON.stringify(
            item.fields.body.content[0].content[0].value.replace(
              /^(.{165}[^\s]*).*/,
              "$1"
            )
          );
          var truncatedLength = truncatedString.length;
          truncatedString = truncatedString.substring(1, truncatedLength - 1);

          Object.assign(item.fields, {
            excerpt: truncatedString
          });
        });

        // console.log(dbBlog);
        // let str = dbBlog[0].dataValues.maincontent

        // let newTrimmedString = str.split('.')[0] + ".";
        // dbBlog['shortenedMain'] = newTrimmedString;

        // console.log("Look Here: ", dbBlog.items[3])

        var hbsObject = {
          blogpost: dbBlog.items,
          headContent: `<link rel="stylesheet" type="text/css" href="styles/blog.css">
                <link rel="stylesheet" type="text/css" href="styles/blog_responsive.css">`
          // shortenedMain: newTrimmedString
        };
        res.render("blog", hbsObject);
      });
  });

  app.get("/blog_single:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    client.getEntry(req.params.id).then(function(entry) {
      // Converting times for template
      Object.assign(entry.fields, {
        shortMonth: moment(entry.fields.date)
          .format("MMM")
          .toUpperCase()
      });
      Object.assign(entry.fields, {
        shortDay: moment(entry.fields.date).format("DD")
      });

      const rawRichTextField = entry.fields.body;
      // let renderedHtml = documentToHtmlString(rawRichTextField);
      Object.assign(entry.fields, {
        renderedHtml: documentToHtmlString(rawRichTextField)
      });
      // })

      var bloghbsObject = {
        article: entry,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
                    <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`
      };
      // console.log("hbsObject:  ", bloghbsObject.article);
      res.render("blog_single", bloghbsObject);
    });
  });

  app.get(["/", "/index.html", "/home"], function(req, res) {
    var vimeoRecord = null;
    let secondRecord = null;
    let thirdRecord = null;

    request(vimeoOptionsHome, function(error, response, body) {
      if (error) throw new Error(error);

      vimeoRecord = JSON.parse(body);

      console.log(moment().format());

      client
        .getEntries({
          content_type: "events",
          "fields.featuredOnHome": true,
          "fields.endDate[gte]": moment().format(),
          order: "fields.date",
          limit: 3
        })
        .then(function(dbEvent) {
          // console.log("LOOK HERE: ", dbEvent.items[0].fields);
          var items = dbEvent.items;

          // Converting times for template
          items.forEach(item => {
            Object.assign(item.fields, {
              shortMonth: moment(item.fields.date).format("MMM")
            });
            Object.assign(item.fields, {
              shortDay: moment(item.fields.date).format("DD")
            });
            if (item.fields.featured) {
              Object.assign(item.fields, {
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
              });
            }
            // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
            if (item.fields.repeatsEveryDays > 0) {
              if (moment(item.fields.date).isBefore(moment())) {
                let start = moment(item.fields.date);
                let end = moment();

                while (start.isBefore(end)) {
                  start.add(item.fields.repeatsEveryDays, "day");
                }
                console.log(start.format("MM DD YYYY"));
                item.fields.date = start.format("YYYY-MM-DD");
                item.fields.shortMonth = start.format("MMM");
                item.fields.shortDay = start.format("DD");
              }
            }
          });

          secondRecord = dbEvent;

          client
            .getEntries({
              content_type: "blog",
              "fields.featureOnHomePage": true,
              order: "-fields.datePosted",
              limit: 3
            })
            .then(function(dbBlog) {
              // console.log(dbBlog.items)
              var items = dbBlog.items;

              // Converting times for template
              items.forEach(item => {
                Object.assign(item.fields, {
                  formattedDate: moment(item.fields.datePosted)
                    .format("DD MMM, YYYY")
                    .toUpperCase()
                });

                var truncatedString = JSON.stringify(
                  item.fields.body.content[0].content[0].value.replace(
                    /^(.{165}[^\s]*).*/,
                    "$1"
                  )
                );
                var truncatedLength = truncatedString.length;
                truncatedString = truncatedString.substring(
                  1,
                  truncatedLength - 1
                );

                Object.assign(item.fields, {
                  excerpt: truncatedString
                });
              });

              thirdRecord = dbBlog;
            })
            .then(function(body) {
              // console.log(body)
              // console.log("VIMEO SAYS: ", vimeoRecord);
              // console.log("CONTENTFUL SAYS: ", secondRecord.items[0])
              // console.log("LOOK HERE: ", thirdRecord.items);

              var hbsObject = {
                events: secondRecord.items,
                vimeo: vimeoRecord,
                blogpost: thirdRecord.items,
                headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
              <link rel="stylesheet" type="text/css" href="styles/responsive.css">`
              };

              // console.log(hbsObject)

              res.render("home", hbsObject);
            });
        });
    });
  });

  app.get("/cms", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms.html"));
  });

  app.get("/cms-post", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms-post.html"));
  });

  // app.get("/events", function (req, res) {
  //     res.sendFile(path.join(__dirname, "../public/events.html"));
  // })

  app.get("/events", function(req, res) {
    client
      .getEntries({
        content_type: "events",
        "fields.endDate[gte]": moment().format(),
        order: "fields.date"
      })
      .then(function(dbEvent) {
        var items = dbEvent.items;

        // Converting times for template
        items.forEach(item => {
          Object.assign(item.fields, {
            shortMonth: moment(item.fields.date).format("MMM")
          });
          Object.assign(item.fields, {
            shortDay: moment(item.fields.date).format("DD")
          });
          if (item.fields.featured) {
            Object.assign(item.fields, {
              dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
            });
          }

          // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
          if (item.fields.repeatsEveryDays > 0) {
            if (moment(item.fields.date).isBefore(moment())) {
              let start = moment(item.fields.date);
              let end = moment();

              while (start.isBefore(end)) {
                start.add(item.fields.repeatsEveryDays, "day");
              }
              console.log(start.format("MM DD YYYY"));
              item.fields.date = start.format("YYYY-MM-DD");
              item.fields.shortMonth = start.format("MMM");
              item.fields.shortDay = start.format("DD");
            }
          }
        });

        var hbsObject = {
          events: dbEvent.items,
          headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`
        };

        console.log(dbEvent.items[0]);
        return res.render("events", hbsObject);
      });
  });

  app.get("/about", function(req, res) {
    res.render("about", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`
    });
  });

  app.get("/sermons", function(req, res) {
    request(vimeoOptions, function(error, response, body) {
      if (error) throw new Error(error);
      //

      console.log("BODY HERE: ", body);

      var vimeo = JSON.parse(body);
      // console.log(vimeo)

      var latestSermon = JSON.parse(body).data[0];
      // console.log(latestSermon);

      var hbsObject = {
        vimeo: vimeo,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/sermons.css">
                <link rel="stylesheet" type="text/css" href="styles/sermons_responsive.css">`
      };

      return res.render("sermons", hbsObject);
    });
  });

  app.get("/contact", function(req, res) {
    res.render("contact", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/contact.css">
        <link rel="stylesheet" type="text/css" href="styles/contact_responsive.css">`
    });
  });

  app.get("/ministries", function(req, res) {
    res.render("ministries", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/ministries.css">
        <link rel="stylesheet" type="text/css" href="styles/ministries_responsive.css">`
    });
  });

  app.get("/ministry:id", function(req, res) {
    // console.log("HEY")
    req.params.id = req.params.id.substring(1);
    // console.log("LOOK HERE: ", req.params.id)
    client
      .getEntries({
        content_type: "blog",
        "fields.ministry": req.params.id
      })
      .then(function(entry) {
        // console.log(entry)

        var items = entry.items;

        Object.assign(entry.items[0].fields, {
          request: req.params.id
        });

        // console.log("LOOK HERE: ", entry.items)

        // Converting times for template
        items.forEach(item => {
          // Converting Date info
          Object.assign(item.fields, {
            formattedDate: moment(item.fields.datePosted)
              .format("DD MMM, YYYY")
              .toUpperCase()
          });

          // Creating article excerpt
          var truncatedString = JSON.stringify(
            item.fields.body.content[0].content[0].value.replace(
              /^(.{165}[^\s]*).*/,
              "$1"
            )
          );
          var truncatedLength = truncatedString.length;
          truncatedString = truncatedString.substring(1, truncatedLength - 1);

          Object.assign(item.fields, {
            excerpt: truncatedString
          });

          // Render HTML if featured on requested ministry
          if (item.fields.featureOnMinistryPage) {
            // console.log(item.fields)
            const rawRichTextField = item.fields.body;
            // let renderedHtml = documentToHtmlString(rawRichTextField);
            Object.assign(item.fields, {
              renderedHtml: documentToHtmlString(rawRichTextField)
            });
          }
        });

        // console.log("LOOK HERE", entry)

        var bloghbsObject = {
          blogpost: entry.items,
          request: req.params.id,
          headContent: `<link rel="stylesheet" type="text/css" href="styles/blog.css">
                <link rel="stylesheet" type="text/css" href="styles/blog_responsive.css">`
        };
        // console.log("hbsObject:  ", bloghbsObject.blogpost);
        res.render("ministry", bloghbsObject);
      });
  });

  // Page for individual events
  app.get("/event:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    client.getEntry(req.params.id).then(function(dbEvent) {
      // Converting times for template
      Object.assign(dbEvent.fields, {
        shortMonth: moment(dbEvent.fields.date).format("MMM")
      });
      Object.assign(dbEvent.fields, {
        shortDay: moment(dbEvent.fields.date).format("DD")
      });
      if (moment(dbEvent.fields.date).isAfter(moment())) {
        
        Object.assign(dbEvent.fields, {
          dateToCountTo: moment(dbEvent.fields.date).format("MMMM D, YYYY")
        });
      }

      console.log(dbEvent.fields.dateToCountTo)

      // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
      if (dbEvent.fields.repeatsEveryDays > 0) {
        if (moment(dbEvent.fields.date).isBefore(moment())) {
          let start = moment(dbEvent.fields.date);
          let end = moment();

          while (start.isBefore(end)) {
            start.add(dbEvent.fields.repeatsEveryDays, "day");
            // dbEvent.add(dbEvent.fields.repeatsEveryDays, "day");
          }
          console.log(start.format("MM DD YYYY"));
          dbEvent.fields.date = start.format("YYYY-MM-DD");
          dbEvent.fields.shortMonth = start.format("MMM");
          dbEvent.fields.shortDay = start.format("DD");
        }
      }

      // CONVERT MARKDOWN TO HTML
      if (dbEvent.fields.description) {
        
        dbEvent.fields.description = marked(dbEvent.fields.description)
      }
      
       
       // RENDER HTML FOR DESCRIPTION
      //  const rawRichTextField = dbEvent.fields.description;
       // let renderedHtml = documentToHtmlString(rawRichTextField);
      //  Object.assign(dbEvent.fields, {
      //    renderedHtml: documentToHtmlString(rawRichTextField)
      //   });
        // console.log(dbEvent.fields.renderedHtml)
        
      var hbsObject = {
        events: dbEvent,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`
      };

      // console.log(dbEvent);
      return res.render("event", hbsObject);
    });
  });
};
