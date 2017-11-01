class Hooks {

  constructor() {
    this.groups = {};
    this.data = {};
    this.syncCheck = {};
  }

  newHookGroup(name, sync = true) {
    if (!this.groups[name]) {
      this.groups[name] = [];
      if (sync) {
        this.syncCheck[name] = true;
      } else {
        this.syncCheck[name] = false;
      }
    } else if (this.groups[name] && typeof sync === 'boolean' && this.syncCheck[name] !== sync) {
      this.syncCheck[name] = sync;
    } else {
      return false;
    }
  }

  hook(group, funcDesc, func, key = undefined, replace = true, sync = 'noset') {
    this.newHookGroup(group, sync);
    const newHook = {description: funcDesc, fn: func};
    if (func && typeof func === 'function') {
      if (key || key === 0) {
        if (!replace) {
          this.groups[group].splice(key, 0, newHook);
        } else {
          this.groups[group][key] = newHook;
        }
      } else {
        this.groups[group].push(newHook);
      }
    }
  }

  hookGroup(group, funcsArray, sync = 'noset') {
    if (funcsArray && Array.isArray(funcsArray)) {
      this.newHookGroup(group, sync);
      const filteredArray = funcsArray.filter((el, key) => {
        if (el.fn && el.description && typeof el.fn === 'function' && typeof el.description === 'string') {
          return el;
        } else {
          console.error(`The element with the key of '${key}' within your array could not be added because it either did not contain the properties of description and/or fn, or may not have been in the correct format.`);
          return false;
        }
      });
      this.groups[group] = filteredArray;
    } else {
      console.error(`The second parameter must be an array`);
    }
  }

  runHooks(group) {
    if (this.groups[group]) {
      const sync = this.syncCheck[group];
      const funcs = this.groups[group].map(hook => {
        return hook.fn;
      });
      if (sync) {
        return new Promise((res, rej) => {
          return res(funcs.reduce((p, f) => p.then(f), Promise.resolve()));
        });
      } else {
        const allArr = funcs.map(hook => {
          return hook();
        });
        return Promise.all(allArr);
      }
    } else {
      return new Promise((res, rej) => {return res(`No hooks in '${group}' hook group`);});
    }
  }

  getHookTree(obj, json, displayFunctions, type = false, group = false) {
    if (!json) {
      return obj;
    } else {
      let preppedObj = {};
      // console.log(obj);
      if (type === 'all') {
        Object.keys(obj).forEach((hookGroup) => {
          let groupName = hookGroup;
          if (this.syncCheck[hookGroup]) {
            groupName += ' (Sync)';
          } else {
            groupName += ' (Async)';
          }
          preppedObj[groupName] = obj[hookGroup];
          preppedObj[groupName].map((hook, key, array) => {
            return hook.key = key;
          });
        });
      } else if (type === 'group') {
        preppedObj = {};
        let groupName = group;
        if (this.syncCheck[group]) {
          groupName += ' (Sync)';
        } else {
          groupName += ' (Async)';
        }
        preppedObj[groupName] = this.groups[group];
        preppedObj[groupName].map((hook, key, array) => {
          hook.key = key;
        });
      } else {
        preppedObj = obj;
        preppedObj.key = type;
      }
      const display = JSON.stringify(preppedObj, (key, value) => {
        if (typeof value === 'function') {
          if (displayFunctions) {
            return value.toString();
          } else {
              return '[Function]';
          }
        } else {
          return value;
        }
      }, 2)
      return display;
    }
  }

  getHook(group, key, json = false, displayFunctions = false) {
    return this.getHookTree(this.groups[group][key], json, displayFunctions, key);
  }

  getHookGroup(group, json = false, displayFunctions = false) {
    return this.getHookTree(this.groups[group], json, displayFunctions, 'group', group);
  }

  getHooks(json = false, displayFunctions = false) {
    return this.getHookTree(this.groups, json, displayFunctions, 'all');
  }

  unhook(group, key) {
    if (this.groups[group]) {
      if (this.groups[group][key]) {
        this.groups[group].splice(key, 1);
      } else {
        console.error(`The hook group '${group}' does not contain the key of '${key}'.`);
      }
    } else {
      console.error(`The hook group '${group}' does not exist.`);
    }
  }

  unhookGroup(group) {
    if (this.groups[group]) {
      this.groups[group] = [];
    } else {
      console.error(`The hook group '${group}' does not exist.`);
    }
  }

  unhookAll() {
    this.groups = {};
    this.checkSync = {};
  }

  getClone(source) {
    if (Object.prototype.toString.call(source) === '[object Array]') {
      let clone = [];
      for (let i=0; i<source.length; i++) {
          clone[i] = this.getClone(source[i]);
      }
      return clone;
    } else if (typeof(source)=="object") {
      let clone = {};
      for (let prop in source) {
        if (source.hasOwnProperty(prop)) {
          clone[prop] = this.getClone(source[prop]);
        }
      }
      return clone;
    } else {
      return source;
    }
  }

  cloneHook(fromGroup, fromKey, toGroup, toKey, replace) {
    const hookFrom = this.getHook(fromGroup, fromKey);
    const copyHook = this.getClone(hookFrom);
    this.hook(toGroup, copyHook.description, copyHook.fn, toKey, replace);
  }

  cloneHookGroup(fromGroup, toGroup, replace) {
    const copyGroup = this.getClone(this.groups[fromGroup]);
    if (replace) {
      this.hookGroup(toGroup, copyGroup, this.syncCheck[fromGroup]);
    } else {
      const firstGroup = this.groups[toGroup];
      const joinedGroups = firstGroup.concat(copyGroup);
      this.hookGroup(toGroup, joinedGroups);
    }
  }

  moveHook(fromGroup, fromKey, toGroup, toKey, replace) {
    const hookFrom = this.getHook(fromGroup, fromKey);
    this.hook(toGroup, hookFrom.description, hookFrom.fn, toKey, replace);
    this.unhook(fromGroup, fromKey);
  }

  swapHooks(fromGroup, fromKey, toGroup, toKey) {
    if (fromGroup === toGroup && fromKey !== toKey) {
      const groupFrom = this.getHookGroup(fromGroup);
      groupFrom[toKey] = groupFrom.splice(fromKey, 1, groupFrom[toKey])[0];
      this.hookGroup(fromGroup, groupFrom);
    } else if (fromGroup !== toGroup) {
      const hookFrom = this.getHook(fromGroup, fromKey);
      const hookTo = this.getHook(toGroup, toKey);
      this.unhook(fromGroup, fromKey);
      this.unhook(toGroup, toKey);
      this.cleanHooks([fromGroup, toGroup]);
      this.hook(toGroup, hookFrom.description, hookFrom.fn, toKey, false);
      this.hook(fromGroup, hookTo.description, hookTo.fn, fromKey, false);
    } else {
      return false;
    }
  }

  hookGroupSync(group, sync = true) {
    this.newHookGroup(group, sync);
  }

  cleanHookGroup(group) {
    this.groups[group] = this.groups[group].filter(hook => {
      if (hook !== (undefined || null || '')) {
        return hook;
      } else {
        return false;
      }
    });
  }

  cleanHooks(hookGroups = undefined) {
    if (hookGroups) {
      if (typeof hookGroups === 'string') {
        this.cleanHookGroup(hookGroups);
      } else if (Array.isArray(hookGroups)) {
        hookGroups.forEach(group => {
          this.cleanHookGroup(group);
        });
      } else {
        return false;
      }
    } else {
      for (let group in this.groups) {
        this.cleanHookGroup(group);
      }
    }
  }
}

module.exports = Hooks;