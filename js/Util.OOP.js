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

Util.OOP = {};

/**
 * Extends an object by mixing in the properties of another object.
 * @param	{object}	target	The object into which things will be mixed
 * @param	{object}	source	The object providing the properties
 * @type object
 * @return target
 */
Util.OOP.extend = function(target, source)
{
	var names = Util.Object.names(source);
	for (var i = 0; i < names.length; i++) {
		target[names[i]] = source[names[i]];
	}
	
	return target;
}

/**
 * Sets up inheritance from parent to child. To use:
 * - Create parent and add parent's methods and properties.
 * - Create child
 * - At beginning of child's constructor, call inherits(parent, child)
 * - Add child's new methods and properties
 * - To call method foo in the parent: this.superclass.foo.call(this, params)
 * - Be careful where you use self and this: in inherited methods, self
 *   will still refer to the superclass, whereas this will refer, properly, to the
 *   child class. If you must use self, e.g. for event listeners, define self
 *   only inside methods, not directly inside the constructor. (Note: The existing
 *   code doesn't follow this advice perfectly; follow this advice, not that code.)
 *
 * Changed on 2007-09-13 by EN: Now calls the parent class's constructor! Any
 * arguments that need to be passed to the constructor can be provided after
 * the child and parent.
 *
 * Inspired by but independent of <http://www.crockford.com/javascript/inheritance.html>.
 *
 * The main problem with just doing something like
 *     child.prototype = new parent();
 * is that methods inherited from the parent can't set properties accessible
 * by methods defined in the child.
 */
Util.OOP.inherits = function(child, parent)
{
	var parent_prototype = null;
	var nargs = arguments.length;
	
	if (nargs < 2) {
		throw new TypeError('Must provide a child and a parent class.');
	} else if (nargs == 2) {
		parent_prototype = new parent;
	} else {
		// XXX: Is there really no better way to do this?!
		//      Something involving parent.constructor maybe?
		var arg_list = $R(2, nargs).map(function (i) {
			return 'arguments[' + String(i) + ']';
		});
		eval('parent_prototype = new parent(' + arg_list.join(', ') + ')')
	}
	
	Util.OOP.extend(child, parent_prototype);
	child.superclass = parent_prototype;
};

/**
 * Sets up inheritance from parent to child, but only copies over the elements
 * in the parent's prototype provided as arguments after the parent class.
 */
Util.OOP.swiss = function(child, parent)
{
	var parent_prototype = new parent;
    for (var i = 2; i < arguments.length; i += 1) {
        var name = arguments[i];
        child[name] = parent_prototype[name];
    }
    return child;
};