//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const passwordDB = process.env.DB_PASSWORD;
const addr = "mongodb+srv://dbUser:" + passwordDB +"@cluster0.c6fst.mongodb.net/todolistDB?retryWrites=true&w=majority";
mongoose.connect(addr, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false});
const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const item1 = new Item({name: "Welcome to your Todo List"});
const item2 = new Item({name: "Hit the + button to add a new item"});
const item3 = new Item({name: "<-- Hit is to delete the item"});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  const day = date.getDate();
  Item.find({}, function(err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("defaultItems inserted successfully");
          };
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: items, todayDate: day});
      };
    };
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    // need to add item to custom list
    List.findOne({name: listName}, function(err, foundList) {
       foundList.items.push(item);
       foundList.save();
       res.redirect("/" + listName);
    });
  };
});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully deleted " + checkedItemId);
      };
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err) {
      if (!err) {
        res.redirect("/" + listName);
      };
    });
  };
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // creat a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      };
    };
  });
});

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started");
});
