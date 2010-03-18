/**
 * Tools for simulating classical-style inheritance in JavaScript.
 *
 * JavaScript supports object-oriented programming, but unlike many common
 * languages, its object system is based on prototypes, not classes. Consider
 * the following example Java class:
 *
 *     public class Foo {
 *         public int value;
 *
 *         public Foo(int initialValue) {
 *             value = initialValue;
 *         }
 *         
 *         public void doubleValue() {
 *             value = value * 2;
 *         }
 *     }
 * 
 * In Java, the non-static members of a class exactly define what instance
 * variables and methods will be available on objects of that class. When you
 * create a new Foo object, that object will have an instance variable named
 * "value" and one method named "doubleValue". You can manipulate the value of
 * the instance variable and call the method, but you cannot add or remove
 * instance variables, or add, remove, or change methods. As a result, each Foo
 * object is, in a sense, interchangeable. Different objects may have different
 * integers stored in "value", but they all share the exact same set of
 * instance variables and the exact same set of methods.
 * 
 * This isn't true in JavaScript. Here is one way of reimplementing the above
 * class in JavaScript:
 *
 *     function Foo(initialValue) {
 *         this.value = initialValue;
 *     }
 *     
 *     Foo.prototype.doubleValue = function doubleValue() {
 *         this.value = this.value * 2;
 *     }
 * 
 * The parallels are obvious: there is clearly some sort of constructor, and
 * also a "doubleValue" method. You can use Foo objects in largely the same
 * way that they would be used in the Java implementation:
 * 
 *     var foo = new Foo(12); // foo is a new object, and foo.value is 12
 *     foo.doubleValue(); // foo.value is now 24
 * 
 * But there's no syntactic difference between the Foo() constructor and any
 * other JavaScript function. In Java, the fact that the Foo function acts as
 * the initializer for a new object is established when Foo is defined (by the
 * simple fact that it occurs inside a class, and it has the same name as the
 * class it is inside of).
 * 
 * In JavaScript, however, you instead signal that you *want* Foo to act as the
 * initializer for a new object by prefixing the call to it with the "new"
 * keyword. It is possible to call Foo (accidentally or intentionally) without
 * prefixing it with "new", but the effects are wildly different:
 * 
 *     var foo = Foo(12); // foo is undefined (since the Foo function doesn't
 *                        // return anything), and window.value is now 12
 * 
 * When you call Foo without "new", the value of "this" inside the function
 * body is the JavaScript environment's default object, which, in a browser, is
 * the "window" object. So, the line "this.value = initialValue;" is, in this
 * case, equivalent to "window.value = initialValue;". This is probably not
 * what was desired, so Loki follows the convention of capitalizing the names
 * of class constructor functions, and not capitalizing all other functions, to
 * help you remember when you should use "new" and when you should not.
 * 
 * So, to recap, in JavaScript, class constructors are just normal-looking
 * functions (except for the fact that, in their bodies, they do things to
 * "this"), and you make them construct new objects by prefixing all calls to
 * them with the "new" operator. This explains how the Foo function works, but
 * there's still the matter of doubleValue. What is "Foo.prototype"?
 * 
 * A prototype object is JavaScript's analog of Java's class member sets. Each
 * function in JavaScript automatically gets a prototype property, and objects
 * who get created using that function have all of the members of the prototype
 * available on them.
 *
 * In other words, when the Foo function is called with the "new" operator, the
 * JavaScript interpreter behaves as if we'd written this in its body instead:
 * 
 *     function Foo(initialValue) {
 *         var this = {}; // create a new object
 *         
 *         // make properties of the prototype available on "this":
 *         for (var _name in Foo.prototype) {
 *             this[_name] = Foo.prototype[_name];
 *         }
 *         
 *         // the code we explicitly wrote
 *         this.value = initialValue;
 *         
 *         // return the newly-created object to the caller
 *         return this;
 *     }
 * 
 * Because all properties on a function's prototype are automatically included
 * in all objects constructed using that function, you can use prototypes to
 * approximate Java-style classes. The JavaScript implementation of Foo above
 * defines the "doubleValue" method by assigning it to the doubleValue property
 * of Foo's prototype.
 *
 * TODO: revise the above text, and talk about inheritance.
 */

Util.OOP = {
	/**
	 * Extends an object by copying the properties of another object into it.
	 *
	 * All of the properties on `source` will be copied into `target`. Any
	 * existing properties on `target` that had the same name as a property on
	 * `source` will have their value overwritten.
	 *
	 * Returns the target object.
	 */
	extend: function extend_object(target, source) {
		var name;
		
		for (name in source) {
			target[name] = source[name];
		}
		
		return target;
	},
	
	/**
	 * Copies all the properties of the given module onto the given target's
	 * prototype.
	 *
	 * Equivalent to using Util.OOP.extend with "target.prototype" instead of
	 * "target".
	 *
	 * Returns the given target (not its prototype).
	 */
	mixin: function mix_in_module(target, module) {
		Util.OOP.extend(target.prototype, module);
		return target;
	},
	
	/**
	 * Creates a new instance of the given parent class, and copies all of
	 * that instance's properties onto the given child index.
	 *
	 * Any extra parameters passed to this function are passed through to the
	 * parent class constructor.
	 *
	 * Note that this function is used to implement "old-style", closure-based
	 * inheritance in Loki. It should not be used in new code, unless its use
	 * is necessary to implement an existing paradigm (e.g.,
	 * extending UI.Dialog).
	 */
	inherits: function object_inherits_from_class(child, parent) {
		var parent_prototype;
		var i;

		if (arguments.length < 2) {
			throw new TypeError('Must provide a child and a parent class.');
		} else if (arguments.length == 2) {
			// no arguments need to be passed to the parent constructor
			parent_prototype = new parent();
		} else {
			// pass all additional arguments to the parent constructor
			// using eval() is the best way known to get all correct behavior,
			// so think twice about changing this (admittedly ugly) code
			var arg_list = [];
			for (i = 0; i < arguments.length; i++) {
				arg_list.push('arguments[' + i + ']');
			}
			
			eval('parent_prototype = new parent(' + arg_list.join(', ') + ')');
		}
		
		Util.OOP.extend(child, parent_prototype);
		child.superclass = parent_prototype;
		child.__superClass__ = parent_prototype; // CoffeeScript convention
	}
};
