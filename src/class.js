/*
 * Namespace: Loki.Class
 *
 * Contains functions for aiding object-oriented programming.
 */
Loki.Class = {
	// Function: create
	// Creates a new class.
	//
	// Usage:
	//     The following example creates a trivial class named Foo, and an
	//     equally-trivial subclass of Foo named Bar.
	//     > var Foo = Loki.Class.create({
	//     >     initialize: function Foo() { this.x = true; }
	//     > });
	//     > var Bar = Loki.Class.create(Foo, {
	//     >     initialize: function Bar() { this.y = false; }
	//     > });
	//
	// Parameters:
	//     (Function) [superclass] - a class from which this class will inherit
	//     (Object) prototype - the class's prototype; a constructor function,
	//                          if any, should be named "initialize" in the
	//                          prototype
	//
	// Returns:
	//     (Function) the newly-created class
	//
	// Throws:
	//     TypeError - if _prototype_ is not an object or if _superclass_ (if
	//                 given) is not a function
	create: function create_class(superclass, prototype) {
		if (arguments.length == 0) {
			superclass = null;
			prototype = {};
		} else if (arguments.length == 1) {
			prototype = superclass;
			superclass = undefined;
		}
		
		if (typeof(superclass) != 'undefined' && typeof(superclass) != 'function') {
			throw new TypeError("If given, the superclass must be a function.");
		} else if (typeof(prototype) != 'object' || prototype === null) {
			throw new TypeError("The class's prototype must be an object.");
		}
		
		var cl = prototype.initialize || (function T() { });
		delete prototype.initialize;
		
		if (superclass) {
			var my_proto = prototype;
			var subclass = function() { };
			subclass.prototype = superclass.prototype;
			prototype = new subclass();
			Loki.Object.extend(prototype, my_proto);
			cl.superclass = superclass;
		}
		
		cl.prototype = prototype;
		cl.prototype.constructor = cl;
		return cl;
	},
	
	// Function: mixin
	// Adds an object to a class's prototype. See <Loki.Object.extend> if you
	// need to mix an object into any general object.
	//
	// Parameters:
	//     (Function) class - The class to which the object will be mixed in
	//     (Object) object - The object that will be mixed in
	mixin: function add_object_to_class(class_, object) {
		Loki.Object.extend(class_.prototype, object);
	}
};
