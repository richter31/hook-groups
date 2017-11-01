#HookGroups Class

## Table of Contents
- [Set Up](#set-up)
	- [Set Up Example](#appjs)
- [Initiatizing](#initializing)
- [Hook Group vs. Hook](#hook-group-vs-hook)
- [Creating Hooks](#creating-hooks)
	- [.hook()](#hook)
	- [.hookGroup()](#hookgroup)
- [Running Hooks](#running-hooks)
	- [.runHooks()](#runhooks)
- [Getting Hooks](#gettinghooks)
	- [.getHook()](#gethook)
	- [.getHookGroup()](#gethookgroup)
	- [.getHooks()](#gethooks)
- [Removing Hooks](#removing-hooks)
	- [.unhook()](#unhook)
	- [.unhookGroup()](#unhookgroup)
	- [.unhookAll()](#unhookall)
- [Cloning Hooks](#cloning-hooks)
	- [.cloneHook()](#clonehook)
	- [.cloneHookGroup()](#clonehookgroup)
- [Altering Hooks](#altering-hooks)
	- [.moveHook()](#movehook)
	- [.swapHooks()](#swaphooks)
	- [.hookGroupSync()](#hookgroupsync)
	- [.cleanHookGroup()](#cleanhookgroup)
	- [.cleanHooks()](#cleanhooks)

## Set Up
General set up would include file(s) dedicated to editing hooks, a file to create a hook-able object that defines the method(s) which use/include the hooks, and finally the file(s) of the app, which call in and use the hooked object.

Here is an example of a basic set up to creating a hook-able object which runs express, and allows developers to hook before and after the initializing of express and even change the port from a separate file.

[Back to Table of Contents](#table-of-contents)

###App.js
```javascript
const express = require('express');
const HookGroups = require('./HookGroups');
const App = new Hooks();

App.exp = express();

App.hook('setport', 'sets port to 3000', () => {
    new Promise((res, rej) => {
        App.data.portListen = 3000;
        res('done');
    });
});

App.init = () => {
    App.runHooks('setport')
    .then(
        done => {
            return App.runHooks('preinit');
        }
    ).then(
        done => {
            return new Promise((res, rej) => {
                App.exp.listen(App.data.portListen, App.runHooks('postinit'));
            });
        }
    ).catch(
        error => {
            console.error(error);
        }
    );
}

module.exports = App;
```

###hooks.js

```javascript
const App = require('./App');

exports.hooks = () => {
  App.hook('setport', 'sets port to 4000', () => {
      new Promise((res, rej) => {
          App.data.portListen = 4000;
          res('done');
      });
  }, 0, true);

  App.hook('preinit', 'logs that init is about to start', () => {
      new Promise((res, rej) => {
          console.log(`About to listen to port ${App.data.portListen}`);
          res('done');
      });
  });

  App.hook('postinit', 'logs that now listening', () => {
      new Promise((res, rej) => {
          console.log(`Now listening to port ${App.data.portListen}...`);
          res('done');
      });
  });
};
```

###index.js

```javascript
const App = require('./App');
const {hooks} = require('./hooks');

hooks();
App.init();
```
[Back to Table of Contents](#table-of-contents)

## Initializing
Make a new instance of a the HookGroups Class.

  ```javascript
  const TestHooks = new Hooks();
  ```

[Back to Table of Contents](#table-of-contents)

## Hook Group vs. Hook
A HookGroups instance can contain any number of hook groups which themselves can contain any number of hooks. A hook group would generally be created to represent a given time that hooks would occur. For instance if you had a HookGroups instance of SaveDB, you might have a 'presave' hook group or a 'postsave' hook group that would each contain multiple hooks to be done prior to or after a save to the database.

An individual hook is pushed to a specific hook group. For instance, with our SaveDB example above, if certain data wanted to be retrieved and fiddled with prior to the DB save, it could be a hook applied to the 'presave' hook group.

When a hook group is run, it executes all of the functions inside that hook group (even async hooks would be run synchronously by default, but they don't have to).

[Back to Table of Contents](#table-of-contents)

## Creating Hooks
There are two ways to create hooks and hook groups.

###.hook()
**.hook(hook-group-name (String), hook-description (String), function (Anonymous Function that returns a Promise), [key (Integer)[, replace-current-key (Boolean)[, run-hook-group-synchronously (Boolean)]]])**

- *hook-group-name* - (String) - Required - This is the hook group you would like to place the hook in, if there currently is no hook group with this name, it will be created.
- *hook-description* - (String) - Required - This is not generally important except when using any of the getter methods (.getHooks(), .getHookGroup(), .getHook()) for displaying the hooks. As such it is best to give that hook a description that really explains what it does, for when looking at the various hooks in a hook group, a description of what it does will be helpful.
- *function* - (Anonymous Function) - Required - This is the core of what you want your hook to do. Although not required for hook groups full of synchronous functions, it is best to make these return Promises. For filtering data, and some other action-type hooks, you may wish to store, or make changes to, data in the HookGroups instance's data property, to pass along to other hooks, if desired.
- *key* - (Integer) - Optional - Default: undefined - Since the hook group is an array of hooks, you can specify which key this function will specifically fall into. If this is left out, the hook will simply be pushed to the end of the hook group.
- *replace-current-key* - (Boolean) - Optional - Default: True - if *key* is set, will replace whatever hook is set at the same key. However, if set to false, this hook will be inserted into the set key but any hook in that key already, and any after, will be shifted up by one.
- *run-hook-group-synchronously* - (Boolean || 'noset' (String)) - Optional - Default: 'noset' (String) - If 'noset' or True, and hook group does not already exist, the hook group will be set to run synchronously. If set to false, it will be set to run asynchronously (if there are asynchronous functions in the hook group). However, if hook group is already set, then 'noset' will keep it as is and True, will ensure the whole hook group is set to run synchronously.

```javascript
const TestHooks = new Hooks();
TestHooks.hook('testHookGroup', 'logs message', () => {
  return new Promise((res, rej) => {
    console.log('Hello World');
    res('done');
  });
}, 1, true, false);
```
The above example adds a hook to the key 1 in a newly made 'testHookGroup' hook group, if there happened to be one created beforehand this will replace any hook set at the key of 1, and this will ensure that the hook group runs asynchronously.

[Back to Table of Contents](#table-of-contents)

###.hookGroup()
**.hook(hook-group-name (String), hook-group-array (Array)[, run-synchronously (Boolean)])**

- *hook-group-name* - (String) - Required - This is the hook group you would like to place your array of hooks into, if there currently is no hook group with this name, it will be created.
- *hook-group-array* (Array) - Required - This array must be formatted as an array of objects each with a description property and a fn property, which holds your hooks description and anonymous function, which *should* return a Promise, respectively. The order they appear will be the key order they will be assigned. If this hook group already exists, this *will* replace any and all hooks in the specified hook group.
- *run-synchronously* - (Boolean || 'noset' (String)) - Optional - Default: 'noset' (String) - If 'noset' or True, and hook group does not already exist, the hook group will be set to run synchronously. If set to false, it will be set to run asynchronously (if there are asynchronous functions in the hook group). However, if hook group is already set, then 'noset' will keep it as is and True, will ensure the whole hook group is set to run synchronously.

```javascript
const TestHooks = new Hooks();
TestHooks.data.x = 5;
TestHooks.hookGroup('testHookGroup', [
  {
    description: 'logs message',
    fn: () => {
	  return new Promise((res, rej) => {
	    console.log('Hello World');
	    res('done');
	  });
    }
  },
  {
    description: 'adds and returns 3 + x from data property',
    fn: () => {
	  return new Promise((res, rej) => {
		TestHooks.data.x + 3;
	    res('done');
	  });
    }
  }
]);
```
The above example will either create or replace the hook group 'testHookGroup', additionally, if the hook group does not exist it will be set to run synchronously default, if it already exists, it will run either synchronously or asynchronously, whichever the hook group was already set to.

[Back to Table of Contents](#table-of-contents)

##Running hooks
Running hooks is quite simple you just find the place in your code that you want to run your hooks and use the proper method. You will more than likely want to run a hook group, with the *.runHooks()* method within another custom made method of your HookGroups instance. Additionally, your hook groups are run and chained with .then() methods as they are built around Promises.

Note that *.runHooks()* will still run fine even if calling to run a hook group that doesn't yet exist, this is so that a placeholder option for hooks can be placed throughout the code that other developers may hook into without altering the core code.

###.runHooks()
**.runHooks(hook-group (String))**

- *hook-group*  - (String) - Required - The hook group that you want to run.

You can find a great example in the set up section [here](#appjs)

[Back to Table of Contents](#table-of-contents)

##Getting Hooks
The methods to get hooks can be use full for returning all of the hook groups, a single hook group, or a single hook within a hook group. They can also be returned as a beautified JSON string, or as an object.

###getHook()
**getHook(hook-group-name (String), key (Integer), [returnJSONString (boolean), [stringifyFunction (boolean)]])**

**returns: Object || JSON String**

- *hook-group-name* - (String) - Required - the name of the hook group of the hook you would like to return.
- *key* - (Integer) - Required - The key of the hook in the hook group's array.
- *returnJSONString* - (Boolean) - optional - Default: false - By default getHook() will return an object of the indicated hook. However, if set to true, it will stringify (beautified) the hook. If set to true, a "false property" of key, will be added to the stringified hook. Keep in mind that no hooks have the "key" property, it is just there to have an easy glance at what key each hook is, and only occurs if this parameter is set to true.
- *stringifyFunction* - (Boolean) - optional - Default: false - Requires: returnJSONString = true - By default, if returning a JSON string, the functions in the hook will be converted to the string: '[Function]'. However, if set to true, the function will be stringified and displayed as well.

```javascript
const TestHooks = new Hooks();
TestHooks.hook('testGroup', 'log hello world', () => {
  return new Promise((res, rej) => {
    console.log('Hello World!');
    res('done');
  });
}, 3);
const hook = TestHooks.getHook('testGroup', 3);
console.log(hook);
```
This is what would be logged to the console:

```javascript
{ description: 'log hello world', fn: [Function] }
```
[Back to Table of Contents](#table-of-contents)

###getHookGroup()
**getHookGroup(hook-group-name (String), [returnJSONString (boolean), [stringifyFunction (boolean)]])**

**returns: Object || JSON String**

- *hook-group-name* - (String) - Required - the name of the hook group you would like to return.
- *returnJSONString* - (Boolean) - optional - Default: false - By default getHookGroup() will return an object of the indicated hook group. However, if set to true, it will stringify (beautified) the hook group. If set to true, the name of the hook group will have either "(Sync)" or "(Async)" appended to name, this is not actually part of the name but it is placed there so you will know how the hook group will run at a glance. Additionally, a "false property" of key, will be added to the stringified hooks. Keep in mind that no hooks have the "key" property, it is just there to have an easy glance at what key each hook is, and only occurs if this parameter is set to true.
- *stringifyFunction* - (Boolean) - optional - Default: false - Requires: returnJSONString = true - By default, if returning a JSON string, the functions in the hooks will be converted to the string: '[Function]'. However, if set to true, the function will be stringified and displayed as well.

```javascript
const TestHooks = new Hooks();
TestHooks.hookGroup('pre', [
  {
    description: 'logs message',
    fn: () => {
      return new Promise((res, rej) => {
        console.log('Hello World');
        res('done');
      });
    }
  },
  {
    description: 'logs second message',
    fn: () => {
      return new Promise((res, rej) => {
        console.log('Another Test Message');
        res('done');
      });
    }
  }
], false);
const theHookGroup = TestHooks.getHookGroup('pre', true);
console.log(theHookGroup);
```
This is what would be logged to the console:

```javascript
{
  "pre (Async)": [
    {
      "description": "logs message",
      "fn": "[Function]",
      "key": 0
    },
    {
      "description": "logs second message",
      "fn": "[Function]",
      "key": 1
    }
  ]
}
```
[Back to Table of Contents](#table-of-contents)

###getHooks()
**getHooks([returnJSONString (boolean), [stringifyFunction (boolean)]])**

**returns: Object || JSON String**

- *returnJSONString* - (Boolean) - optional - Default: false - By default getHooks() will return an object of the hook groups. However, if set to true, it will stringify (beautified) the hook groups. If set to true, the name of the hook groups will have either "(Sync)" or "(Async)" appended to them, this is not actually part of the name but it is placed there so you will know how the hook group will run at a glance. Additionally, a "false property" of key, will be added to the stringified hooks. Keep in mind that no hooks have the "key" property, it is just there to have an easy glance at what key each hook is, and only occurs if this parameter is set to true.
- *stringifyFunction* - (Boolean) - optional - Default: false - Requires: returnJSONString = true - By default, if returning a JSON string, the functions in the hooks will be converted to the string: '[Function]'. However, if set to true, the function will be stringified and displayed as well.

```javascript
const TestHooks = new Hooks();
TestHooks.hookGroup('pre', [
  {
    description: 'logs message',
    fn: () => {
      return new Promise((res, rej) => {
        console.log('Hello World');
        res('done');
      });
    }
  },
  {
    description: 'logs second message',
    fn: () => {
      return new Promise((res, rej) => {
        console.log('Another Test Message');
        res('done');
      });
    }
  }
]);
TestHooks.hook('post', 'logs last message', () => {
  return new Promise((res, rej) => {
  console.log('Goodbye Cruel World!');
    res('done');
  });
})
const theHooks = TestHooks.getHooks(true, true);
console.log(theHooks);
```
This is what would be logged to the console:

```
{
  "pre (Sync)": [
    {
      "description": "logs message",
      "fn": "() => {\n      return new Promise((res, rej) => {\n        console.log('Hello World');\n        res('done');\n      });\n    }",
      "key": 0
    },
    {
      "description": "logs second message",
      "fn": "() => {\n      return new Promise((res, rej) => {\n        console.log('Another Test Message');\n        res('done');\n      });\n    }",
      "key": 1
    }
  ],
  "post (Sync)": [
    {
      "description": "logs last message",
      "fn": "() => {\n  return new Promise((res, rej) => {\n  console.log('Goodbye Cruel World!');\n    res('done');\n  });\n}",
      "key": 0
    }
  ]
}
```
[Back to Table of Contents](#table-of-contents)

##Removing Hooks
The following methods will remove hooks. Many times there may be hooks made throughout multiple files and/or the object may use the hook groups multiple times and the option to remove hooks along the way may be required for the focus of your app.

###.unhook()
**unhook(group-name (String), key (Integer))**

- *group-name* - (String) - Required - the name of the hook group of the hook that you would like to remove.
- *key* - (Integer) - Required - the key of the hook, in it's hook group, that you would like to remove.

[Back to Table of Contents](#table-of-contents)

###.unhookGroup()
**unhookAll(group-name (String))**

- *group-name* - (String) - Required - the name of the hook group that you would like to clear. Note that this will not *actually* remove the hook group, but rather it will make the hook group empty.

[Back to Table of Contents](#table-of-contents)

###.unhookAll()
**unhookAll()**

This method has no parameters and will completely clear out all hooks and hook groups to a clean slate. Note that the hook groups will no longer exist, although, a runHooks() will still run fine and should not break the app, even if calling upon a hook group that does not exist.

[Back to Table of Contents](#table-of-contents)

##Cloning Hooks
Sometimes the hooks and hook groups may be needed in various instances, but you won't have to create them all over again. You can clone hooks and hook groups into a new hook group or an existing one.

###.cloneHook()
**cloneHook(fromGroup (String), fromKey (Integer), toGroup (String), toKey (Integer), replace(Boolean))**

- *fromGroup* - String - Required - the hook group of the hook you want to clone
- *fromKey* - Integer - Required - the hook's key that you want to clone
- *toGroup* - String - Required - the hook group that you want the hook to clone to. If this hook group does not yet exist, it will be created fro you.
- *toKey* - Integer - Required - the key in the hook group you want to clone the hook to.
- *replace* - Boolean - Required - Whether or not you want to replace any hook already in the key of the hook group you want to clone to. If set to false, the hook that pre-exists in that key, and all hooks after, will be shifted up by one.

[Back to Table of Contents](#table-of-contents)

###.cloneHookGroup()
**cloneHookGroup(fromGroup (String), toGroup (String), replace(Boolean))**

- *fromGroup* - String - Required - the hook group you want to clone
- *toGroup* - String - Required - the hook group you want to clone to. If it does not currently exist it will be created for you.
- *replace* - Boolean - Required - Whether or not you want to completely replace the hook group you are cloning to with the hook group you are cloning. If false, it will concatenate the cloning hook group to the end.

[Back to Table of Contents](#table-of-contents)

##Altering Hooks
Much like in the case of needed to remove hooks and hook groups, many times you may need to rearrange them i various situations, or change whether they run synchronously/asynchronously, or you may want to clean up hook groups with empty keys.

###moveHook()
Allows you to move a hook from one place to another. If you are planning on switching the 'location' of two different hooks it is recommended to use .swapHooks() instead.

Note: using this method will clean up the applicable hook group(s), i.e. will remove empty keys, after the moving has occurred.

**moveHook(fromGroup (String), fromKey (Integer), toGroup (String), toKey (Integer), replace (Boolean))**

- *fromGroup* - String - Required - the hook group in which the hook exists before the move.
- *fromKey* - Integer - Required - the key of the hook before the move
- *toGroup* - String - Required - the hook group to which the hook will be moved to, this can be the same as *fromGroup*.
- *toKey* - Integer - Required - the key of the *toGroup* that you want to move the hook to.
- *replace* - Boolean - Required - Whether or not you want to replace any hook that may exist in your *toGroup* that has the key of *toKey*. If set to false, the hook that was already there, and all hooks after it, will be shifted up by one.

[Back to Table of Contents](#table-of-contents)

###.swapHooks()
Allows you to switch the position of 2 hooks either within the same hook group or between two hook groups.

Note: using this method will clean up the applicable hook group(s), i.e. will remove empty keys, after the swapping has occurred.

**swapHooks(fromGroup, fromKey, toGroup, toKey)**

- *fromGroup* - String - Required - the hook group in which the first hook exists before the swap.
- *fromKey* - Integer - Required - the key of the first hook before the swap
- *toGroup* - String - Required - the hook group in which the second hook exists before the swap. this may be the same as *fromGroup*
- *toKey* - Integer - Required - the key of the second hook before the swap

[Back to Table of Contents](#table-of-contents)

###.hookGroupSync()
This method simply allows you to change whether a hook group runs all of its hooks synchronously or asynchronously.

**hookGroupSync(groupName (String)[, runSync (Boolean)])**

- *groupName* - String - Required - The hook group that you want to change
- *runSync* - Boolean - Optional - Default: True - Whether or not you want the hook group its hooks synchronously.

[Back to Table of Contents](#table-of-contents)

###.cleanHookGroup()
Removes empty keys from a hook group. Note: this may change some of the current hooks' keys.

**cleanHookGroup(groupName (String))**

- *groupName* - String - Required -  the hook group that you want to remove the empty keys from.

[Back to Table of Contents](#table-of-contents)

###.cleanHooks()
Removes all empty keys from all hook groups or a specified array of hook groups.

**cleanHooks(hookGroups (String | Array of Strings))**

- *hookGroups* - Sting or Array of Strings - Optional - Default: undefined - Accepts a single string of a specified hook group, an array of specified hook groups. This will remove empty keys from all of the specified hooks. If left undefined, it will clean every hook group.

[Back to Table of Contents](#table-of-contents)