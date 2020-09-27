const { createReadStream } = require("fs-extra");
const csv = require("csv-parser");

class UserRepository {
  constructor() {}

  async readUsers(onUserCallback) {
    return new Promise((resolve, reject) => {
      // Reading and parsing data.csv
      createReadStream("data.csv")
        .on("error", (err) => {
          reject(err);
        })
        // Pipe stream into csv parser
        .pipe(csv())
        .on("data", (row) => {
          onUserCallback(this.parseUser(row));
        })
        .on("end", () => {
          resolve();
        });
    });
  }

  parseUser(row) {
    return {
      id: row.Id,
      email: row.Email,
      name: row.Name,
      dob: row.DOB,
      country: row.Country,
    };
  }

  deleteUser(id) {
    // TODO: Potentially we'd like to remove user from the filesystem
    // to persist a delete request
  }
}

module.exports = UserRepository;
