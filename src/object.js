/*
 * Namespace: Loki.Object
 *
 * Contains functions for working with objects.
 */
Loki.Object = {
	// Function: extend
	// 
	// Copies all properties from the source object to the destination. If you
	// need to extend a class's prototype, it is more convenient to use
	// <Loki.Class.mixin>.
	// 
	// Parameters:
	// 	(Object) destination - the object to which the properties are copied
	// 	(Object) source - the object from which the properties are copied
	// 	(Boolean) [overwrite=true] - if false, will not overwrite any existing
	// 	properties in the destination object
	// 
	// Returns:
	// 	(Object) the destination object
 	extend: function extend_object(destination, source, overwrite) {
		if (typeof(overwrite) == 'undefined' || overwrite === null)
			overwrite = true;
		for (var name in source) {
			if (overwrite || !(name in destination))
				destination[name] = source[name];
		}
		return destination;
	},
	
	// Function: keys
	// Returns the keys (property names) of the object. Only properties defined
	// on the object itself are returned; properties on Object.prototype are
	// ignored.
	//
	// 	Parameters:
	// 		(Object) obj - the object whose names are desired
	//
	// 	Returns:
	// 		(Array) that object's keys
	keys: function object_keys(obj) {
		var keys = [];
		for (var name in obj) {
			if (!(name in Object.prototype))
				keys.push(name);
		}
		return keys;
	},
	
	// Function: values
	// Returns the property values of the object. Only properties defined
	// on the object itself are returned; properties on Object.prototype are
	// ignored.
	//
	// 	Parameters:
	// 		(Object) obj - the object whose values are desired
	//
	// 	Returns:
	// 		(Array) that object's values
	values: function object_values(obj) {
		var keys = Loki.Object.keys(obj), values = [];
		for (var i = 0; i < keys.length; i++)
			values.push(obj[keys[i]]);
		return values;
	},
	
	// Function: enumerate
	// Calls the given function once per property in the object. Only properties
	// defined on the object itself are enumerated; properties on
	// Object.prototype are ignored.
	//
	// Parameters:
	//     (Object) obj - the object to enumerate
	//     (Function) func - the function to call with each property; it should
	//                       accept the key as the first parameter and the value
	//                       as the second
	//     (Object) [thisp] - an optional "this" context for the function
	enumerate: function enumerate_object(obj, func, thisp) {
		var keys = Loki.Object.keys(obj);
		for (var i = 0; i < keys.length; i++) {
			func.call(thisp || null, keys[i], obj[keys[i]]);
		}
	},
	
	// Function: clone
	// Clones an object.
	//
	// Parameters:
	//     (Object) obj - the object to clone
	//     (Boolean) [deep=false] - if true, recursively clones any object
	//                              children of _obj_
	//
	// Returns:
	//     (Object) the clone
	//
	// Throws:
	//     TypeError - if _obj_ is not an object
	clone: function clone_object(obj, deep) {
		if (!Loki.Object.isObject(obj))
			throw new TypeError("It doesn't make sense to clone a non-object.");
		
		function clone(obj) {
			var new_obj;
			if (!obj || typeof(obj) != 'object')
				return obj;
			
			try {
				new_obj = new obj.constructor();
			} catch (e) {
				new_obj = {};
			}
			
			if (deep) {
				Loki.Object.enumerate(obj, function(key, val) {
					new_obj[key] = clone(val);
				});
			} else {
				Loki.Object.enumerate(obj, function(key, val) {
					new_obj[key] = val;
				});
			}
			
			return new_obj;
		}
		
		return clone(obj);
	},
	
	// Function: equal
	// Determines if two values are equal. For scalars, a normal comparison
	// using == is performed. Objects' properties are recursively compared; they
	// are considered equal if they each have exactly the same set of keys and
	// the values for each key are equal. Scalars and objects are never equal.
	//
	// Parameters:
	//     (any) a - something
	//     (any) b - something
	//
	// Returns:
	//     (Boolean) true if _a_ and _b_ are equal
	equal: function objects_equal(a, b) {
		var seen;
		if (typeof(a) != 'object') {
			return (typeof(b) == 'object')
				? false
				: (a == b);
		} else if (typeof(b) != 'object') {
			return false;
		}

		seen = {};

		for (var name in a) {
			if (!(name in b && Loki.Object.equal(a[name], b[name])))
				return false;
			seen[name] = true;
		}

		for (var name in b) {
			if (!(name in seen))
				return false;
		}

		return true;
	},
	
	// Function: isObject
	// Checks to see if the parameter is a normal object.
	//
	// Parameters:
	//     (any) obj - the possible object
	//
	// Returns:
	//     (Boolean) true if typeof(obj) == "object", false if otherwise
	isObject: function is_object(obj) {
		return obj && typeof(obj) == 'object';
	},
	
	// Function: isNode
	// Checks to see if the parameter is a DOM node.
	//
	// Parameters:
	//     (any) obj - the possible node
	//
	// Returns:
	//     (Boolean) true if _obj_ is a node, false if otherwise
	isNode: function object_is_node(obj) {
		return (obj && obj.nodeType);
	},
	
	// Function: isElement
	// Checks to see if the parameter is a DOM element.
	//
	// Parameters:
	//     (any) obj - the possible element
	//
	// Returns:
	//     (Boolean) true if _obj_ is an element, false if otherwise
	isElement: function object_is_element(obj) {
		return (obj && obj.nodeType == Node.ELEMENT_NODE);
	},
	
	// Function: isArray
	// Checks to see if the parameter is an array.
	//
	// Parameters:
	//     (any) obj - the possible array
	//
	// Returns:
	//     (Boolean) true if _obj_ is an array, false if otherwise
	isArray: function object_is_array(obj) {
		return (obj && typeof(obj) == 'object' && 'splice' in obj &&
			'join' in obj && Loji.Object.isNumber(obj.length));
	},
	
	// Function: isFunction
	// Checks to see if the parameter is a function.
	//
	// Parameters:
	//     (any) obj - the possible function
	//
	// Returns:
	//     (Boolean) true if _obj_ is a function, false if otherwise
	isFunction: function object_is_function(obj) {
		return typeof(obj) == 'function';
	},
	
	// Function: isString
	// Checks to see if the parameter is a string.
	//
	// Parameters:
	//     (any) obj - the possible string
	//
	// Returns:
	//     (Boolean) true if _obj_ is a string ,false if otherwise
	isString: function object_is_string(obj) {
		return typeof(obj) == 'string';
	},
	
	// Function: isNumber
	// Checks to see if the parameter is a number.
	//
	// Parameters:
	//     (any) obj - the possible number
	//
	// Returns:
	//     (Boolean) true if _obj_ is a number, false if otherwise
	isNumber: function object_is_number(obj) {
		return typeof(obj) == 'number';
	},
	
	// Function: isRegExp
	// Checks to see if the parameter is a regular expression.
	//
	// Parameters:
	//     (any) obj - the possible regular expression
	//
	// Returns:
	//     (Boolean) true if _obj_ is a regular expression, false if otherwise
	isRegExp: function object_is_regexp(obj) {
		if (obj instanceof RegExp)
			return true;
		
		// the above doesn't always work, because each window has its own
		// copy of RegExp (sigh)
		return (typeof(obj.test) == "function"
			&& typeof(obj.exec) == "function"
			&& typeof(obj.lastIndex) == "number");
	},
	
	// Function: isDefined
	// Checks to see if the parameter is defined.
	//
	// Parameters:
	//     (any) obj - the possibly-defined value
	//
	// Returns:
	//     (Boolean) true if _obj_ is defined, false if otherwise
	isDefined: function object_is_defined(obj) {
		return typeof(obj) != 'undefined';
	},
	
	// Function: isUndefined
	// Checks to see if the parameter is undefined.
	//
	// Parameters:
	//     (any) obj - the possibly-undefined value
	//
	// Returns:
	//     (Boolean) true if _obj_ is undefined, false if otherwise
	isUndefined: function object_is_undefined(obj) {
		return typeof(obj) == 'undefined';
	},
	
	// Function: isValid
	// Checks to see if the parameter is "valid": not undefined and non-null.
	//
	// Parameters:
	//     (any) obj - the possibly-valid value
	//
	// Returns:
	//     (Boolean) true if _obj_ is valid, false if otherwise
	isValid: function object_is_valid(obj) {
		return obj !== null && typeof(obj) != 'undefined';
	},
};

// Improve Loki.Object.keys() if Object.prototype.hasOwnProperty is available.
if (typeof(Object.prototype.hasOwnProperty) == 'function') {
	Loki.Object.keys = function object_keys(obj) {
		var keys = [];
		for (var name in obj) if (obj.hasOwnProperty(name)) {
			keys.push(name);
		}
		return keys;
	};
}
