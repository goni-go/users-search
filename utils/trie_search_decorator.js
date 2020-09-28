module.exports = {
  removeUserFromTree(user, root, minLength) {
    // First, remove user from full name path in the tree
    const name = user.name.toLowerCase();
    removeUserFromPathOnTree(name, user, root, minLength);

    // Second, remove user from all partial names (middle and/or last name)
    // path in the tree
    const tokens = name.split(" ");
    for (let i = 1; i < tokens.length; i++) {
      let token = tokens[i];
      // All name/tokens which less then minimum chars, concated to
      // spaces when inserted to the tree
      while (token.length < minLength) {
        token += " ";
      }
      removeUserFromPathOnTree(token, user, root, minLength);
    }
    return;

    // Creating path to the user object and then delete it
    function removeUserFromPathOnTree(name, user, root, minLength) {
      const keyArr = nameToKeyArr(name, minLength);
      removeRecursively(keyArr, 0, user, root);
      return;

      // Creating keys path that direct to the user object in the tree
      function nameToKeyArr(name, minLength) {
        let keyArr = [name.substring(0, minLength)];
        keyArr = keyArr.concat(name.substring(minLength).split(""));
        return keyArr;
      }

      // Recursively remove all tree's objects with no user at the end
      // of their path
      function removeRecursively(keyArr, index, user, node) {
        if (index >= keyArr.length) {
          return;
        }

        removeRecursively(keyArr, index + 1, user, node[keyArr[index]]);

        // Last key conatains the value array with include the pointer
        // to the requested user
        if (index == keyArr.length - 1) {
          // console.log(node[keyArr[index]]);
          removeFromValues(node, keyArr[index], user);
        }

        // In case object is empty - there are no users at the end of
        // that path and we can remove node from the tree
        if (Object.keys(node[keyArr[index]]).length == 0) {
          // console.log(node[keyArr[index]]);
          delete node[keyArr[index]];
        }

        return;

        function removeFromValues(node, key, user) {
          const values = node[key].value;

          // In case values array contains the requested user only -
          // the all array should be removed from the tree
          if (values.length <= 1) {
            delete node[key].value;
            return;
          }

          // Create new array without the requested user and update node
          let newValues = [];
          for (const value of values) {
            if (value.user != user) {
              newValues.push(value);
            }
          }

          node[key].value = newValues;
        }
      }
    }
  },
};
