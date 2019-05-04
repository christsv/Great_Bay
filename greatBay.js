var mysql = require("mysql");
var inquirer = require("inquirer");


var connection = mysql.createConnection({
    // testing this
    host: "127.0.0.1",
    port: 3306,
    user: "root",

    password: "birdlife2621",
    database: "greatBay_DB"
});

connection.connect(function(err){
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    startPrompt();
});


function register(){
    inquirer
    .prompt({
        type: 'list',
        name: 'register',
        message: "Login or Sign-up to proceed to auction.",
        choices: ["LOG-IN", "SIGN-UP"]
    })
    .then(answers => {
        if(answers.register.toUpperCase() == "LOG-IN"){
            login();
        }
        else{
            signup();
        }
    })
}

function signup(){
    inquirer
    .prompt([
        {
            name: 'username',
            type: 'input',
            message: "Enter a Username please! \n"
        },
        {
            name: 'password',
            type: 'password',
            message: "Enter a password for the respective username please! \n"
        }

    ])
    .then(answers => {
        connection.query(
            "INSERT INTO signups SET ?",
            {
                username: answers.username,
                password: answers.password
            },
            function(err, res){
                if (err) throw err;
                console.log(res.affectedRows + " Account Registered! \n");
                login();

            }
        )
    })
}

function login(){
    inquirer
    .prompt([
        {
            name: 'username',
            type: 'input',
            message: "Please enter your username to login!"
        },
        {
            name: 'password',
            type: 'password',
            message: "Please enter your password to login!"
        }
    ])
    .then(answers => {
        connection.query(
            "SELECt * FROM signups", function(err, res){
                if (err) throw err;
                // this is the result of the data in the signsups table
                // console.log(res);
                for(var i = 0; i < res.length; i++){
                    if(answers.username == res[i].username){
                        if(answers.password == res[i].password){
                            console.log("Successful!----------- \n");
                            startPrompt();
                        }
                    }
                    else{
                        console.log("Wrong username or password. Please try again!\n");
                        register();
                    }
                }
            }

        )
    })
}





function startPrompt(){
    inquirer
    .prompt({
        type: 'list',
        name: 'postbid',
        message: "Would you like to [POST] an auction or [BID] on an auction?",
        choices: ["POST", "BID", "NVM"]
    })
    .then(answers => {
        if(answers.postbid.toUpperCase() == "POST"){
            postAuction();
        }
        else if (answers.postbid.toUpperCase() == "BID") {
            bidAuction();
        }
        else if (answers.postbid.toUpperCase() == "NVM") {
            readDB();
        }
        
    });
}


function postAuction(){
    console.log("You are in the Post Section");
    inquirer
    .prompt([
    {
        name: "item",
        type: "input",
        message: "What is the item you would like to submit to the auction?"
    },
    {
        name: "category",
        type: "input",
        message: "What would you categorize this item as?"
    },
    {  
        name: "startingbid",
        type: "input",
        message: "What would you like the starting bid to be?",
        validate: function(value){
            if (isNaN(value) === false) {
                return true;
              }
              return false;
        }
    }])
    .then(answer => {
        console.log("Awesome! We are adding " + answer.item + " to the auction!.... \n");
        var query = connection.query(
            "INSERT INTO auctions SET ?",
            {
                item_name: answer.item,
                category: answer.category,
                starting_bid: answer.startingbid,
                highest_bid: answer.startingbid 
            },
            function(err, res){
                if (err) throw err;
                console.log(query.sql + "\n");
                console.log(res.affectedRows  + " product inserted!\n");
                startPrompt();
            }
        )
    }
   
)}

function bidAuction(){
    console.log("You are in the Bid Section. Here are a list of available items to bid on! -------- \n");

    connection.query("SELECT * FROM auctions", function(err, res){
        if (err) throw err;
        console.log(res);
        inquirer
        .prompt([
        {
            type: "rawlist",
            name: "bid",
            message: "What would you like to bid on?",
            choices: function (){ 
                var array = [];
                for (var i = 0; i < res.length; i++){
                    array.push(res[i].item_name);
                }
                return array;}
            },
            {
            type: "input",
            name: "price",
            message: "How much do are you bidding?"
            }     
        ])
        .then(function(answer){

            var choice;
            for(var j = 0; j < res.length; j++){
                if(res[j].item_name == answer.bid){
                    choice = res[j];
                }
            }

         
            if (answer.price > choice.highest_bid){
                connection.query(
                    "UPDATE auctions SET ? WHERE ?",
                    [
                        {
                            highest_bid: answer.price,
                           
                        },
                        {
                            // we cab use this but what if theres two items with same name item_name: answer.bid,
                            // better to use id since it is unique
                            id: choice.id,
                        }
                    ],
                    function(err, res){
                        if (err) throw err;
                        console.log(res.affectedRows + " Bid Place Successful!---------\n");
                        startPrompt();
                    }
                )

            }
            else{
                console.log("Sorry but your bid was not high enough!------- \n")
                startPrompt();
            }
        })
    })
};


function readDB(){
    console.log("Awww.. too bad well here is what we have for sale!------------- \n")
    connection.query("SELECT * FROM auctions", function(err, res){
        if (err) throw err;
        console.log(res);
        connection.end();
    })
}


// with the prompt sign in i am getting this error
// maxlistenersexceededwarning: possible eventemitter memory leak detected. 11 keypress
// listeners added. use emitter.setmaxlisteners() to increase limit
// trouble shoot later
// right now i removed the register thing