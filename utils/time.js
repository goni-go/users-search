const moment = require("moment");

function getDateForAge(age) {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = now.getMonth() + 1;
  const day = now.getDate();

  return moment(`${day}/${month}/${year}`, "DD/MM/YYYY").unix();
}

module.exports = {
  dobToUnixTime(dob) {
    return moment(dob, "DD/MM/YYYY").unix();
  },

  getMaxDoB(age) {
    return getDateForAge(age);
  },

  getMinDoB(age) {
    return getDateForAge(age + 1);
  },
};
