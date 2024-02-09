# whatkey

[![Downloads][npm-dm]][package-url]
[![Downloads][npm-dt]][package-url]
[![NPM Version][npm-v]][package-url]
[![Dependencies][deps]][package-url]
[![Dev Dependencies][dev-deps]][package-url]
[![License][license]][package-url]

A translator for javascript keyboard events to and from consistent and familiar character and key representations.
Take your `keydown`, `keypress`, and `keyup` events and reliably translate them into keyboard keys and characters.

# Example

```javascript
myCanvas.addEventListener('keydown', (event) => {
  const key = whatkey(event).key;
  if (key === 'w') {
    goUp();
  } else if(key === '\n') {
    confirm();
  } else if (key === 'shift') {
    if (event.location === 1) { // left shift
      shiftDown();
    } else {                   // right shift
      shiftUp();
    }
  } else if (key === '\b') {
    event.preventDefault();     // prevent changing pages
  } else {
    const char = whatkey(event).char;
    if (char === 'r') {
      reload()''
    } else if (char === 'R') {
      secondaryReload();
    }
  }
});
textfield.addEventListener('keypress', (e) => {
  const validChars = ['0','1','2','3','4','5'];

  const char = whatkey(event).char;
  if (validChars.indexOf(char) < 0)) {
    event.preventDefault()  // prevent the character from being input
  }
});
```

# Install

```
npm i -S whatkey
// or
yarn add whatkey
// or
bower install whatkey
```


Usage
=====

Accessing whatkey:
```javascript
import whatkey from 'whatkey';
```

Using whatkey:

**`whatkey(event)`** - Takes in a keyboard event from `keypress`, `keyup`, or `keydown` and returns an object that has the following properties:
* **`key`** - The keyboard key pressed. Does not take into account shift, so for example if you type 'A', this will contain 'a'.
* **`char`** - The character created by the key press. Takes into account shift, so if you type 'A', this will contain 'A'.
           Note that in cases where there are multiple keys that give the same character, the simpler character is used (eg. if the `key` is "num_enter", `char` will be "\n")

** `whatkey.unprintableKeys`** - An array of unprintable keys (including backspace and delete, which do usually modify inputs)

## Special Key and character strings

The `key` and `char` values contain the actual character typed ('a', '$', '\t', etc) except in the following cases where the character isn't printable.
The string on the left is the string that represents the conceptual key/character on the right:

* backspace - Backspace key. Note that the `char` value for this will be '\b'
* enter - Enter key. Note that the `char` value for this will be '\n'
* tab - Tab key. Note that the `char` value for this will be '\t'
* shift - the shift key
* meta - windows / command key (here 'meta' is used since the character is named different things on mac vs windows)
* ctrl - control key
* alt - alt key
* pause - pause key
* caps - caps lock key
* esc - escape key
* pageup
* pagedown
* end
* home
* left
* right
* up
* down
* print
* insert
* delete
* num0 - Number pad key 0. Note that the `char` value for this will be '0'.
* num1 - Number pad key 1. Note that the `char` value for this will be '1'.
* num2 - ...
* num3
* num4
* num5
* num6
* num7
* num8
* num9
* num_enter - Number pad enter key. Note that the `char` value for this will be '\n'.
* num_subtract - Number pad subtract key. Note that the `char` value for this will be '-'.
* num_decimal - Number pad decimal key. Note that the `char` value for this will be '.'.
* num_divide - Number pad divide key. Note that the `char` value for this will be '/'.
* f1 - function key 1
* f2 - ...
* f3
* f4
* f5
* f6
* f7
* f8
* f9
* f10
* f11
* f12
* print - print-screen key
* num - num-lock
* scroll - scroll-lock

## keypress vs keydown/keyup

In handling keyboard events, keydown/keyup is almost always the best choice.
However, there is at least one case where you want keypress over keydown/keyup: cases where copy/paste is used.
If you ctrl-v paste some text into a field, for example, a 'keydown' event will see 'shift' and 'v' pressed,
while a keypress handler will see the actual text you pasted in.

There may be other cases where keypress is necessary, but I'm not aware of them.

If you do use keypress, keep in mind that the `key` value is extrapolated from the `char` value, and so may not accurately represent the key pressed.
If you need accuracy for the `key`, use the 'keydown' event.

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT

[npm-dm]: https://img.shields.io/npm/dm/whatkey.svg
[npm-dt]: https://img.shields.io/npm/dt/whatkey.svg
[npm-v]: https://img.shields.io/npm/v/whatkey.svg
[deps]: https://img.shields.io/david/jcgertig/whatkey.svg
[dev-deps]: https://img.shields.io/david/dev/jcgertig/whatkey.svg
[license]: https://img.shields.io/npm/l/whatkey.svg
[package-url]: https://npmjs.com/package/whatkey
