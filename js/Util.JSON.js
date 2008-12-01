Util.JSON = (function JSON() {
	var special = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'\\': '\\\\'
	};
	var indent = "    ";
	
	function str_repeat(string, count) {
		return count < 1 ? '' : new Array(count + 1).join(string);
	}
	
	function pad_number(num, length, radix) {
		var string = num.toString(radix || 10);
		return str_repeat('0', length - string.length) + string;
	}
	
	var primitive_dumpers = {
		"number": function json_dump_number(num) {
			return isFinite(num) ? num.toString() : null;
		},
		
		"string": function json_dump_string(s) {
			s = s.replace(/[\x00-\x1f\\]/g, function(c) {
				var character = special[c];
				return special[c] || '\\u00' + pad_number(c.charCodeAt(0), 2, 16);
			});
			return '"' + s.replace(/"/g, '\\"') + '"';
		},
		
		"boolean": function json_dump_boolean(b) {
			return (b) ? "true" : "false";
		},
		
		"undefined": function json_dump_undefined() {
			return "undefined";
		},
		
		"function": function json_dump_function(fn) {
			throw new TypeError("JSON cannot represent functions!");
		}
	};
	primitive_dumpers['undefined'] = primitive_dumpers['null'];
	
	function json_dump_object(buf, level, object) {
		var last = buf.length - 1;
		buf[last] = buf[last] + '{';
		
		var ci = str_repeat(indent, level + 1);
		var name, start, value;
		var keys = Util.Object.names(object), i, t;
		last = keys.length - 1;
		for (i = 0; i < keys.length; i++) {
			name = keys[i];
			start = ci + primitive_dumpers.string(name) + ": ";
			value = object[name];
			t = typeof(value);
			if (object !== null && t == "object") {
				buf.push(start);
				json_dump_object(buf, level + 1, value);
				if (i < last)
					buf[buf.length - 1] = buf[buf.length - 1] + ",";
			} else {
				value = (object === null) ? 'null' : primitive_dumpers[t](value);
				buf.push(start + value + (i < last ? "," : ""));
			}
		}
		
		buf.push(str_repeat(indent, level) + "}");
	}
	
	return {
		dump: function json_dump(object) {
			var t = typeof(object), dumper, buf;
			if (object === null) {
				return 'null';
			} else if (t == "object") {
				buf = [''];
				json_dump_object(buf, 0, object);
				return buf.join("\n");
			} else {
				dumper = primitive_dumpers[t];
				if (!dumper)
					throw new TypeError("Cannot dump to JSON; unknown type " + t + ".");
				return dumper(object);
			}
		}
	};
})();