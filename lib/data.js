/**
 * Libary for storing and editing data
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

const lib = {};

// Base directory for the data folder

lib.baseDir = path.join(__dirname, "../.data");

// Write data to a file
lib.create = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(
    `${lib.baseDir}/${dir}/${file}.json`,
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        //Write to file and close it
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing new file");
              }
            });
          } else {
            callback("Error writing to new file");
          }
        });
      } else {
        callback("Could nor create new file, it may already exist");
      }
    }
  );
};

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(
    `${lib.baseDir}/${dir}/${file}.json`,
    "utf8",
    function (err, data) {
      if (!err && data) {
        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    }
  );
};

// Update data inside a file
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(
    `${lib.baseDir}/${dir}/${file}.json`,
    "r+",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            // Write to the file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing the file");
                  }
                });
              } else {
                callback("Error writing to the file");
              }
            });
          } else {
            callback("Error truncating file");
          }
        });
      } else {
        callback("Could not open the file for updating, it may not exist yet");
      }
    }
  );
};

// Delete a file
lib.delete = function (dir, file, callback) {
  fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, function (err) {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting the file");
    }
  });
};

// List all the files on a directory
lib.list = function (dir, callback) {
  fs.readdir(`${lib.baseDir}/${dir}/`, function (err, data) {
    if (!err && data && data.length > 0) {
      const trimmedFiles = data.map((fileName) =>
        fileName.replace(".json", "")
      );
      callback(false, trimmedFiles);
    } else {
      callback(err, data);
    }
  });
};

module.exports = lib;
