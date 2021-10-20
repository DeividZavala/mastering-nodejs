/**
 * Request Handlers
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Define the handlers
const handlers = {};

// Users
handlers.users = function (data, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container fot the users submethods
handlers._users = {};

// Users - POST
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement
      ? true
      : false;

  if ((firstName, lastName, phone, password, tosAgreement)) {
    // Make sure that the user doesnt already exist
    _data.read("users", phone, function (err) {
      if (err) {
        // Hash password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create the user object
          const userObj = {
            firstName,
            lastName,
            phone,
            password: hashedPassword,
            tosAgreement: true,
          };

          // Store the user
          _data.create("users", phone, userObj, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.error(err);
              callback(500, { error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { error: "Could not hash the password" });
        }
      } else {
        callback(400, { error: "A user with that phone already exists" });
      }
    });
  } else {
    callback(400, { error: "Missing required fields" });
  }
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Don't let them access anyone else's
handlers._users.get = function (data, callback) {
  // Check that the phone number is valid
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        // Remove the password from the user object before returning it ro the requester
        const { password, ...safeUser } = data;
        callback(200, safeUser);
      } else {
        callback(404, { error: "Could not find specified user" });
      }
    });
  } else {
    callback(400, { error: "Missing required fields" });
  }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (At least one must be specified)
// @TODO Only let an authenticated user update their object. Don't let them update anyone else's
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;

  // Check for the optional fields
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read("users", phone, function (err, data) {
        if (!err && data) {
          if (firstName) {
            data.firstName = firstName;
          }
          if (lastName) {
            data.lastName = lastName;
          }
          if (password) {
            data.password = helpers.hash(password);
          }

          // Store the new updates
          _data.update("users", phone, data, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { error: "Could not update the user" });
            }
          });
        } else {
          callback(404, { error: "The specified user does not exist" });
        }
      });
    } else {
      callback(400, { error: "Missing fields to update" });
    }
  } else {
    callback(400, { error: "Missing required fields" });
  }
};

// Users - DELETE
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user delete their object. Don't let them delete anyone else's
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        _data.delete("users", phone, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: "Could not delete the specified user" });
          }
        });
      } else {
        callback(404, { error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { error: "Missing required fields" });
  }
};

// Tokens

handlers.tokens = function (data, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods

handlers._tokens = {};

// TOKENS - POST
// REQUIRE DATA:  PHONE, PASSWORD
// OPTIONAL DATA: NONE
handlers._tokens.post = function(data, callback){
  const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length === 10
          ? data.payload.phone.trim()
          : false;

  const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;

  if(phone && password){
    // Lookup the user who matches that phone number
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        // Hash the sent password and compare it with the password stored in the user object
        const hashedPassword = helpers.hash(password)
        if(hashedPassword === data.password){
          // If valid, create a new token with random name. Set expiration date one hour in the future
          const token = helpers.createRandomString(20)
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone,
            token,
            expires
          }

          _data.create("tokens", token, tokenObject, function(err){
            if(!err){
              callback(200, tokenObject)
            }else{
              callback(500,{error:"Could not create the new token"})
            }
          })

        }else{
          callback(400, {error:"password did not match user stored password"});
        }
      } else {
        callback(404, { error: "Could not find specified user" });
      }
    });
  }else{
    callback(400, {error:"Missing required field(s)"})
  }
}

// TOKENS -  GET
// REQUIRED DATA: PHONE
// OPTIONAL DATA: NONE
handlers._tokens.get = function(data,callback){
  // Check that the ID is valid
  const id =
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
          ? data.queryStringObject.id.trim()
          : false;

  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, token) {
      if (!err && token) {

        callback(200, token);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { error: "Missing required fields" });
  }
}

// TOKENS -  PUT
// REQUIRED DATA: ID, EXTEND
// OPTIONAL DATA: NONE
handlers._tokens.put= function(data,callback){
  // Check that the ID is valid
  const id =
      typeof data.payload.id === "string" &&
      data.payload.id.trim().length === 20
          ? data.payload.id.trim()
          : false;

  const extend =
      typeof data.payload.extend === "boolean" &&
      data.payload.extend
          ? data.payload.extend
          : false;

  if(id&& extend){
 // Lookup the token
    _data.read("tokens", id, function (err, tokenData){
      if(!err && tokenData){

        // Check to make sure the token is not already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update("tokens", id, tokenData, function (err) {
            if(!err){
              callback(200)
            }else{
              callback(500, {error: "Could not update token's expiration"})
            }
          })

        }else{
          callback(400,{error:"Token has already expires, and cannot be extended"})
        }

      }else{
        callback(400, {error:"Specified token does not exist"})
      }
    })
  }else{
    callback(400,{error:"Missing required field(s) or field(s) are invalid"})
  }


}

// TOKENS - DELETE
// REQUIRED DATA: ID
// OPTIONAL DATA: NONE
handlers._tokens.delete = function (data, callback) {
  // Check that the token is valid
  const id =
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
          ? data.queryStringObject.id.trim()
          : false;

  if (id) {
    _data.read("tokens", id, function (err, data) {
      if (!err && data) {
        _data.delete("tokens", id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(404, { error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { error: "Missing required fields" });
  }

}

// Ping handlers
handlers.ping = function (data, callback) {
  // Callback a httpStatus code
  callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;