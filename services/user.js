const { Dictionary, MultiDictionary, Set } = require("buckets-js");
const UserRepository = require("../repositories/user");
const TrieSearch = require("trie-search");
const { BinarySearchTree } = require("binary-search-tree");
const { dobToUnixTime, getMaxDoB, getMinDoB } = require("../utils/time");

const TRIE_SERACH_OPTIONS = {
  min: 3,
  splitOnRegEx: false,
  ignoreCase: true,
};

class UserService {
  constructor() {
    this.idsDictionary = new Dictionary();
    this.countriesDictionary = new MultiDictionary();
    this.namesTrieSearch = new TrieSearch("name", TRIE_SERACH_OPTIONS);
    this.agesBST = new BinarySearchTree();
    this.userRepository = new UserRepository();
  }

  async initialize() {
    await this.userRepository.readUsers((user) => {
      this.addIdIndex(user.id, user);
      this.addNameIndex(user.name, user);
      this.addCountryIndex(user.country, user);
      this.addAgeIndex(user.dob, user);
    });
  }

  addIdIndex(id, user) {
    this.idsDictionary.set(id, user);
  }

  addNameIndex(name, user) {
    // Adding to the prefix tree the whole name
    // so we'd be able to search by full name
    this.namesTrieSearch.add({ name: name, value: user });

    // Adding to the prefix tree all name parts
    // so we'd be able to search by last name or middle name
    const nameTokens = name.split(" ");
    for (const token of nameTokens) {
      this.namesTrieSearch.add({ name: token, value: user });
    }
  }

  addCountryIndex(country, user) {
    this.countriesDictionary.set(country, user);
  }

  addAgeIndex(dob, user) {
    this.agesBST.insert(dobToUnixTime(dob), user);
  }

  getUser(id) {
    return this.idsDictionary.get(id);
  }

  getUsersByName(name) {
    // This set saves user's ids to avoid duplications
    let idsSet = new Set();
    let users = [];

    // Searching in the prefix tree
    const matches = this.namesTrieSearch.get(name);
    for (const match of matches) {
      // Adding uniquely matched users that were'nt deleted
      if (!match.value.deleted && idsSet.add(match.value.id)) {
        users.push(match.value);
      }
    }

    return users;
  }

  getUsersByCountry(country) {
    return this.countriesDictionary.get(country);
  }

  getUsersByAge(ageStr) {
    // Verify user input
    const age = Number(ageStr);
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
    const user = this.idsDictionary.get(id);
    if (!user) {
      return false;
    }

    // Marking user as deleted since the prefix tree doesn't
    // support deletion
    user.deleted = true;

    this.countriesDictionary.remove(user.country, id);
    this.agesBST.delete(dobToUnixTime(user.dob), id);
    this.idsDictionary.remove(id);

    // Deleting user from filesystem
    this.userRepository.deleteUser(id);

    return true;
  }
}

module.exports = UserService;
