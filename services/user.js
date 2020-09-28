const UserRepository = require("../repositories/user");
const TrieSearch = require("trie-search");
const { BinarySearchTree } = require("binary-search-tree");
const { dobToUnixTime, getMaxDoB, getMinDoB } = require("../utils/time");

const MIN_LENGTH = 3;

const TRIE_SERACH_OPTIONS = {
  min: MIN_LENGTH,
  splitOnRegEx: false,
  ignoreCase: true,
};

class UserService {
  constructor() {
    this.idsMap = {};
    this.countriesMap = {};
    this.namesTrieSearch = new TrieSearch("name", TRIE_SERACH_OPTIONS);
    this.agesBST = new BinarySearchTree();
    this.userRepository = new UserRepository();
  }

  async initialize() {
    await this.userRepository.readUsers((user) => {
      this.addIdIndex(user);
      this.addNameIndex(user);
      this.addCountryIndex(user);
      this.addAgeIndex(user);
    });
  }

  addIdIndex(user) {
    this.idsMap[user.id] = user;
  }

  addNameIndex(user) {
    // Adding to the prefix tree the whole name
    // so we'd be able to search by full name
    this.namesTrieSearch.add({ name: user.name, user: user });

    // Adding to the prefix tree all name parts
    // so we'd be able to search by last name and/or middle name
    const tokens = user.name.split(" ");
    for (let i = 1; i < tokens.length; i++) {
      // Adding spaces to fullfild minimum of 3 chars per token
      let token = tokens[i];
      while (token.length < MIN_LENGTH) {
        token += " ";
      }
      this.namesTrieSearch.add({ name: token, user: user });
    }
  }

  addCountryIndex(user) {
    const { country, id } = user;
    this.countriesMap[country] = this.countriesMap[country] || {};
    this.countriesMap[country][id] = user;
  }

  addAgeIndex(user) {
    this.agesBST.insert(dobToUnixTime(user.dob), user);
  }

  getUser(id) {
    return this.idsMap[id];
  }

  getUsersByName(input) {
    // This set saves user's ids to avoid duplications
    let idsSet = new Set();
    let users = [];

    // Support searching for first/middle/last name with less
    // then minimum chars as defiened (3)
    let name = input;
    while (name.length < MIN_LENGTH) {
      name += " ";
    }

    // Searching in the prefix tree
    const matches = this.namesTrieSearch.get(name);
    for (const match of matches) {
      // Adding uniquely matched users that were'nt deleted
      if (!match.user.deleted && !idsSet.has(match.user.id)) {
        idsSet.add(match.user.id);
        users.push(match.user);
      }
    }

    return users;
  }

  getUsersByCountry(input) {
    let users = [];
    const country = input.toUpperCase();
    const ids = Object.keys(this.countriesMap[country] || {});
    for (const id of ids) {
      users.push(this.getUser(id));
    }

    return users;
  }

  getUsersByAge(input) {
    // Verify user input
    const age = Number(input);
    if (isNaN(age)) {
      return [];
    }

    // Searching in ages binary tree for dob in the range
    // that matches all people within this age
    const users = this.agesBST.betweenBounds({
      $lte: getMaxDoB(age),
      $gt: getMinDoB(age),
    });

    return users;
  }

  deleteUser(id) {
    const user = this.idsMap[id];
    if (!user) {
      return false;
    }

    // Marking user as deleted since the prefix tree doesn't
    // support deletion
    user.deleted = true;

    delete this.countriesMap[user.country][user.id];
    delete this.idsMap[user.id];
    this.agesBST.delete(dobToUnixTime(user.dob), id);

    // Deleting user from filesystem
    this.userRepository.deleteUser(id);

    return true;
  }
}

module.exports = UserService;
