/**
 * Does nothing.
 *
 * @class Container for functions relating to arrays.
 */
Util.Array = function()
{
};

/**
 * Forms a legitimate JavaScript array from an array-like object
 * (eg NodeList objects, function argument lists).
 */
Util.Array.from = function array_from_iterable(iterable)
{
	if (!iterable)
		return [];
	if (iterable.toArray)
		return iterable.toArray();
	
	try {
		return Array.prototype.slice.call(iterable, 0);
	} catch (e) {
		// This doesn't work in Internet Explorer with iterables that are not
		// real JavaScript objects. But we still want to keep around the slice
		// version for performance on Gecko.
		
		var new_array = [];
		for (var i = 0; i < iterable.length; i++) {
			new_array.push(iterable[i]);
		}
		
		return new_array;
	}
	
};

var $A = Util.Array.from; // convenience alias

/**
 * Creates an array of integers from start up to (but not including) stop.
 */
Util.Array.range = function range(start, stop)
{
	if (arguments.length == 1) {
		stop = start;
		start = 0;
	}
	
	var ret = [];
	for (var i = start; i < stop; i++) {
		ret.push(i);
	}
	return ret;
}

var $R = Util.Array.range; // convenience alias

/**
 * Methods that are callable by two methods:
 *  - Util.Array.method_name(some_array, ...)
 *  - some_array.methodName(...)
 * Note the change in naming convention! When added to
 * Array's prototype it is changed to use the JavaScript
 * naming convention (camelCase) instead of Loki's
 * (underscore_separated).
 */
Util.Array.Methods = {
	/**
	 * Executes the given function for each element in the array.
	 * (Available as the "each" method of arrays.)
	 * @param	array	the array over which for_each will loop
	 * @param	func	the function which will be called
	 * @param	thisp	optional "this" context
	 * @see	http://tinyurl.com/ds8lo
	 */
	for_each: function each(array, func)
	{
		var thisp = arguments[2] || null;

		if (typeof(func) != 'function')
			throw new TypeError();

		//if (typeof(array.forEach) == 'function')
		//	return array.forEach(func, thisp);

		var len = array.length;
		for (var i = 0; i < len; i++) {
			if (i in array)
				func.call(thisp, array[i], i, array);
		}
	},
	
	/**
	 * Creates a new array by applying the given function to each element of
	 * the given array.
	 * i.e. [a, b, c, ...] -> [func(a), func(b), func(c), ...]
	 * @param {array} array the array over which map will loop
	 * @param {function} fund the function to apply to each element
	 * @param {object} thisp optional "this" context for the function
	 * @type array
	 * @see http://tinyurl.com/32ww7d
	 */
	map: function map(array, func)
	{
		var thisp = arguments[2] || null;

		var len = array.length;
		var ret = new Array(len);
		for (var i = 0; i < len; i++) {
			if (i in array)
				ret[i] = func.call(thisp, array[i], i, array);
		}

		return ret;
	},
	
	/**
	 * @see http://tinyurl.com/yq3c9f
	 */
	reduce: function reduce(array, func, initial_value)
	{
		if (typeof(func) != 'function')
			throw new TypeError();
		
		var value;
		
		array.each(function(v, i, a) {
			if (value === undefined && initial_value === undefined) {
				value = v;
			} else {
				value = func.call(null, value, v, i, a);
			}
		});
		
		return value;
	},
	
	/**
	 * Returns the first item in the array for which the test function
	 * returns true.
	 * @param	array	the array to search
	 * @param	test	the function which will be called
	 * @param	thisp	optional "this" context
	 */
	find: function find_in_array(array, test, thisp)
	{
		if (typeof(thisp) == 'undefined')
			thisp = null;
		if (typeof(test) != 'function')
			throw new TypeError();

		var len = array.length;

		for (var i = 0; i < len; i++) {
			if (i in array && test.call(thisp, array[i]))
				return array[i];
		}
	},
	
	/**
	 * Returns all items in the array for which the test function
	 * returns true.
	 * @param	array	the array to search
	 * @param	test	the function which will be called
	 * @param	thisp	optional "this" context
	 */
	find_all: function find_all_in_array(array, test, thisp)
	{
		if (typeof(thisp) == 'undefined')
			thisp = null;
		if (typeof(test) != 'function')
			throw new TypeError();

		var len = array.length;
		var results = [];

		for (var i = 0; i < len; i++) {
			if (i in array && test.call(thisp, array[i]))
				results.push(array[i]);
		}

		return results;
	},
	
	/**
	 * Converts the array to a "set": an object whose keys are the original
	 * array's values and whose values are all true. This allows efficient
	 * membership testing of the array when it needs to be done repeatedly.
	 */
	to_set: function array_to_set(array)
	{
		var s = {};
		var len = array.length;
		
		for (var i = 0; i < len; i++) {
			if (i in array)
				s[array[i]] = true;
		}
		
		return s;
	},
	
	min: function min_in_array(array, key_func)
	{
		return array.reduce(function(a, b) {
			if (key_func) {
				return (key_func(b) < key_func(a))
					? b
					: a;
			} else {
				return (b < a)
					? b
					: a;
			}
		});
	},
	
	max: function max_in_array(array, key_func)
	{
		return array.reduce(function(a, b) {
			if (key_func) {
				return (key_func(b) > key_func(a))
					? b
					: a;
			} else {
				return (b > a)
					? b
					: a;
			}
		});
	},
	
	pluck: function pluck_from_array(array, property_name)
	{
		return array.map(function(obj) {
			return obj[property_name];
		});
	},
	
	sum: function sum_of_array(array)
	{
		return array.reduce(function(a, b) {
			return a + b;
		});
	},
	
	product: function product_of_array(array)
	{
		return array.reduce(function(a, b) {
			return a * b;
		});
	},
	
	contains: function array_contains(array, item)
	{
		if (Util.is_function(array.indexOf)) {
			return -1 != array.indexOf(item);
		}
		
		return !!array.find(function(element) {
			return item == element;
		});
	},
	
	/**
	 * Returns true if the function test returns true when given any element
	 * in array.
	 * @param {array}	array	the array to examine
	 * @param {function}	test	the test to apply to the array's elements
	 * @param {object}	thisp	an optional "this" context in which the test
	 *							function will be called
	 * @type boolean
	 */
	some: function some(array, test)
	{
		var thisp = arguments[2] || null;
		
		for (var i = 0; i < array.length; i++) {
			if (i in array) {
				if (test.call(thisp, array[i])) {
					// Found one that works.
					return true;
				}
			}
		}
		
		return false;
	},
	
	/**
	 * Returns true if the function test returns true when executed for each
	 * element in array.
	 * @param {array}	array	the array to examine
	 * @param {function}	test	the test to apply to the array's elements
	 * @param {object}	thisp	an optional "this" context in which the test
	 *							function will be called
	 * @type boolean
	 */
	every: function every(array, test)
	{
		var thisp = arguments[2] || null;
		
		for (var i = 0; i < array.length; i++) {
			if (i in array) {
				if (!test.call(thisp, array[i])) {
					// Found one that doesn't work.
					return false;
				}
			}
		}
		
		return true;
	},
	
	/**
	 * Returns all of the elements of the array that passed the given test.
	 * @param {array}	array	the array to filter
	 * @param {function}	test	a function that will be called for each
	 *								element in the array to determine whether
	 *								or not it should be included
	 * @param {object}	thisp	an optional "this" context in which the test
	 *							function will be called
	 * @type array
	 */
	filter: function filter_array(array, test)
	{
		var thisp = arguments[2] || null;
		
		return array.reduce(function perform_filtration(matches, element) {
			if (test.call(thisp, element))
				matches.push(element);
			return matches;
		}, []);
	},
	
	remove: function remove_from_array(array, item)
	{
		var len = array.length;
		for (var i = 0; i < len; i++) {
			if (i in array && array[i] == item) {
				array.splice(i, 1);
				return true;
			}
		}
		
		return false;
	},
	
	remove_all: function remove_all_from_array(array, item)
	{
		var len = array.length;
		var found = false;
		
		for (var i = 0; i < len; i++) {
			if (i in array && array[i] == item) {
				found = true;
				array.splice(i, 1);
			}
		}
		
		return found;
	},
	
	append: function append_array(a, b)
	{
		// XXX: any more efficient way to do this using Array.splice?
		
		var len = b.length;
		for (var i = 0; i < len; i++) {
			if (i in b) {
				a.push(b[i]);
			}
		}
	}
}

for (var name in Util.Array.Methods) {
	function transform_name(name)
	{
		var new_name = '';
		parts = name.split(/_+/);
		
		new_name += parts[0];
		for (var i = 1; i < parts.length; i++) {
			new_name += parts[1].substr(0, 1).toUpperCase();
			new_name += parts[1].substr(1);
		}
		
		return new_name;
	}
	
	Util.Array[name] = Util.Array.Methods[name];
	
	var new_name;
	switch (name) {
		case 'map':
		case 'reduce':
		case 'filter':
		case 'every':
		case 'some':
			if (!Util.is_function(Array.prototype[name]))
				Array.prototype[name] = Util.Array.Methods[name].methodize();
			break;
		case 'for_each':
			Array.prototype.each = (Array.prototype.forEach ||
					Util.Array.Methods.for_each.methodize());
			break;
		default:
			new_name = transform_name(name);
			Array.prototype[new_name] = Util.Array.Methods[name].methodize();
	}
}