const UserService = require("../services/user");

class UserController {
  constructor() {
    this.userService = new UserService();
    this.initialized = false;
    this.initializedPromise = null;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    // If initialization process already running
    // waiting for it to end
    if (this.initializedPromise) {
      return await this.initializedPromise;
    }

    // Saving promise in case initialize
    // will be called multiple times
    this.initializedPromise = this.userService.initialize();

    // Waiting for initializion to be over
    await this.initializedPromise;
    this.initialized = true;
    console.log(`User service initialized successfuly`);
  }

  async getUserById(id) {
    // Ensure initialization
    await this.initialize();

    console.log(`getUserById called with id: ${id}`);
    return this.userService.getUser(id);
  }

  async getUsersByName(name) {
    // Ensure initialization
    await this.initialize();

    console.log(`getUsersByName called with name: ${name}`);
    return this.userService.getUsersByName(name);
  }

  async getUsersByCountry(country) {
    // Ensure initialization
    await this.initialize();

    console.log(`getUsersByCountry called with country: ${country}`);
    return this.userService.getUsersByCountry(country);
  }

  async getUsersByAge(age) {
    // Ensure initialization
    await this.initialize();

    console.log(`getUsersByAge called with age: ${age}`);
    return this.userService.getUsersByAge(age);
  }

  async deleteUser(id) {
    // Ensure initialization
    await this.initialize();

    console.log(`deleteUser called with id: ${id}`);
    return this.userService.deleteUser(id);
  }
}

module.exports = UserController;
